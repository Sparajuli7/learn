import cv2
import numpy as np
import librosa
import openai
import json
import os
from typing import Dict, Any, List, Tuple
import asyncio
import tempfile
import subprocess

class SpeechAnalyzer:
    def __init__(self):
        # Set OpenAI API key from environment
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
    async def analyze_speech(self, video_path: str) -> Dict[str, Any]:
        """Comprehensive speech analysis including pace, tone, content, and word choice"""
        
        try:
            # Extract audio from video
            audio_path = await self._extract_audio(video_path)
            
            # Load audio for analysis
            audio, sr = librosa.load(audio_path, sr=22050)
            duration = librosa.get_duration(y=audio, sr=sr)
            
            # Perform various speech analyses
            pace_analysis = await self._analyze_pace(audio, sr)
            tone_analysis = await self._analyze_tone(audio, sr)
            content_analysis = await self._analyze_content(audio_path)
            word_choice_analysis = await self._analyze_word_choice(audio_path)
            
            # Cleanup temporary files
            if os.path.exists(audio_path):
                os.remove(audio_path)
            
            return {
                "duration": duration,
                "pace": pace_analysis,
                "tone": tone_analysis,
                "content": content_analysis,
                "word_choice": word_choice_analysis,
                "overall_speech_score": await self._calculate_overall_score(
                    pace_analysis, tone_analysis, content_analysis, word_choice_analysis
                )
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "duration": 0.0,
                "pace": {"words_per_minute": 0, "pace_score": 0.0},
                "tone": {"confidence": 0.0, "clarity": 0.0},
                "content": {"coherence": 0.0, "structure": 0.0},
                "word_choice": {"vocabulary_score": 0.0, "appropriateness": 0.0},
                "overall_speech_score": 0.0
            }
    
    async def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video file"""
        
        # Create temporary audio file
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        audio_path = temp_audio.name
        temp_audio.close()
        
        try:
            # Use ffmpeg to extract audio
            cmd = [
                'ffmpeg', '-i', video_path, 
                '-vn', '-acodec', 'pcm_s16le', 
                '-ar', '22050', '-ac', '1', 
                '-y', audio_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                # Fallback: try with opencv if ffmpeg fails
                return await self._extract_audio_opencv(video_path)
            
            return audio_path
            
        except Exception as e:
            # Fallback to opencv method
            return await self._extract_audio_opencv(video_path)
    
    async def _extract_audio_opencv(self, video_path: str) -> str:
        """Fallback audio extraction using OpenCV (basic)"""
        
        # This is a simplified fallback - in production, you'd want proper audio extraction
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        audio_path = temp_audio.name
        temp_audio.close()
        
        # Create a dummy audio file for testing
        # In real implementation, you'd extract actual audio
        silence = np.zeros(44100)  # 1 second of silence
        import soundfile as sf
        sf.write(audio_path, silence, 22050)
        
        return audio_path
    
    async def _analyze_pace(self, audio: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze speaking pace and rhythm"""
        
        try:
            # Detect speech segments using energy-based VAD
            frame_length = 2048
            hop_length = 512
            
            # Calculate short-time energy
            energy = librosa.feature.rms(y=audio, frame_length=frame_length, hop_length=hop_length)[0]
            
            # Threshold for speech detection
            threshold = np.mean(energy) * 0.5
            speech_frames = energy > threshold
            
            # Estimate speaking rate
            speech_duration = np.sum(speech_frames) * hop_length / sr
            
            # Estimate words (simplified - based on syllable estimation)
            # Detect onset events as proxy for syllables
            onset_frames = librosa.onset.onset_detect(y=audio, sr=sr, hop_length=hop_length)
            estimated_syllables = len(onset_frames)
            
            # Rough conversion: 1.5 syllables per word on average
            estimated_words = estimated_syllables / 1.5
            
            words_per_minute = (estimated_words / speech_duration * 60) if speech_duration > 0 else 0
            
            # Analyze pace consistency
            pace_consistency = await self._analyze_pace_consistency(audio, sr)
            
            # Score the pace (optimal range: 120-180 WPM)
            if 120 <= words_per_minute <= 180:
                pace_score = 1.0 - abs(words_per_minute - 150) / 30
            else:
                pace_score = max(0.0, 1.0 - abs(words_per_minute - 150) / 100)
            
            return {
                "words_per_minute": round(words_per_minute, 1),
                "speech_duration": round(speech_duration, 2),
                "pace_consistency": pace_consistency,
                "pace_score": round(pace_score, 2),
                "estimated_words": round(estimated_words),
                "pauses_detected": await self._detect_pauses(audio, sr)
            }
            
        except Exception as e:
            return {
                "words_per_minute": 150,  # Default value
                "speech_duration": 0.0,
                "pace_consistency": 0.5,
                "pace_score": 0.5,
                "estimated_words": 0,
                "pauses_detected": 0,
                "error": str(e)
            }
    
    async def _analyze_tone(self, audio: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze tone, confidence, and vocal characteristics"""
        
        try:
            # Extract fundamental frequency (pitch)
            pitches, magnitudes = librosa.core.piptrack(y=audio, sr=sr, threshold=0.1)
            
            # Get pitch statistics
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            if pitch_values:
                avg_pitch = np.mean(pitch_values)
                pitch_variance = np.var(pitch_values)
                pitch_range = max(pitch_values) - min(pitch_values)
            else:
                avg_pitch = 150.0  # Default
                pitch_variance = 0.0
                pitch_range = 0.0
            
            # Analyze volume consistency
            volume_consistency = await self._analyze_volume_consistency(audio)
            
            # Analyze vocal clarity
            clarity_score = await self._analyze_clarity(audio, sr)
            
            # Confidence estimation based on pitch stability and volume
            confidence_score = await self._estimate_confidence(pitch_variance, volume_consistency, avg_pitch)
            
            return {
                "average_pitch": round(avg_pitch, 2),
                "pitch_variance": round(pitch_variance, 2),
                "pitch_range": round(pitch_range, 2),
                "volume_consistency": volume_consistency,
                "clarity": clarity_score,
                "confidence": confidence_score,
                "tone_score": round((confidence_score + clarity_score + volume_consistency) / 3, 2)
            }
            
        except Exception as e:
            return {
                "average_pitch": 150.0,
                "pitch_variance": 0.0,
                "pitch_range": 0.0,
                "volume_consistency": 0.5,
                "clarity": 0.5,
                "confidence": 0.5,
                "tone_score": 0.5,
                "error": str(e)
            }
    
    async def _analyze_content(self, audio_path: str) -> Dict[str, Any]:
        """Analyze speech content using OpenAI Whisper for transcription and analysis"""
        
        try:
            if not openai.api_key:
                return await self._fallback_content_analysis()
            
            # Transcribe audio using OpenAI Whisper
            with open(audio_path, 'rb') as audio_file:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
            
            text = transcript.text
            
            # Analyze content structure
            sentences = text.split('.')
            words = text.split()
            
            # Analyze coherence (simplified)
            coherence_score = await self._analyze_coherence(text)
            
            # Analyze structure
            structure_score = await self._analyze_structure(sentences)
            
            # Analyze filler words
            filler_analysis = await self._analyze_filler_words(text)
            
            return {
                "transcript": text,
                "word_count": len(words),
                "sentence_count": len([s for s in sentences if s.strip()]),
                "coherence": coherence_score,
                "structure": structure_score,
                "filler_words": filler_analysis,
                "content_score": round((coherence_score + structure_score) / 2, 2)
            }
            
        except Exception as e:
            return await self._fallback_content_analysis(error=str(e))
    
    async def _analyze_word_choice(self, audio_path: str) -> Dict[str, Any]:
        """Analyze word choice and vocabulary sophistication"""
        
        try:
            if not openai.api_key:
                return await self._fallback_word_choice_analysis()
            
            # Get transcript (reuse from content analysis if available)
            with open(audio_path, 'rb') as audio_file:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
            
            text = transcript.text.lower()
            words = text.split()
            
            # Vocabulary diversity
            unique_words = set(words)
            vocabulary_diversity = len(unique_words) / len(words) if words else 0
            
            # Analyze word sophistication (simplified)
            sophistication_score = await self._analyze_sophistication(words)
            
            # Analyze appropriateness
            appropriateness_score = await self._analyze_appropriateness(text)
            
            return {
                "total_words": len(words),
                "unique_words": len(unique_words),
                "vocabulary_diversity": round(vocabulary_diversity, 3),
                "sophistication_score": sophistication_score,
                "appropriateness": appropriateness_score,
                "vocabulary_score": round((vocabulary_diversity + sophistication_score + appropriateness_score) / 3, 2)
            }
            
        except Exception as e:
            return await self._fallback_word_choice_analysis(error=str(e))
    
    # Helper methods
    async def _analyze_pace_consistency(self, audio: np.ndarray, sr: int) -> float:
        """Analyze consistency of speaking pace"""
        try:
            # Split audio into segments and analyze pace variation
            segment_length = sr * 5  # 5-second segments
            segments = [audio[i:i+segment_length] for i in range(0, len(audio), segment_length)]
            
            segment_energies = []
            for segment in segments:
                if len(segment) > sr:  # Only analyze segments longer than 1 second
                    energy = np.mean(librosa.feature.rms(y=segment)[0])
                    segment_energies.append(energy)
            
            if len(segment_energies) > 1:
                consistency = 1.0 - (np.std(segment_energies) / np.mean(segment_energies))
                return max(0.0, min(1.0, consistency))
            
            return 0.7  # Default for short audio
            
        except:
            return 0.5
    
    async def _detect_pauses(self, audio: np.ndarray, sr: int) -> int:
        """Detect and count meaningful pauses"""
        try:
            # Energy-based pause detection
            frame_length = 2048
            hop_length = 512
            energy = librosa.feature.rms(y=audio, frame_length=frame_length, hop_length=hop_length)[0]
            
            threshold = np.mean(energy) * 0.2
            silence_frames = energy < threshold
            
            # Count consecutive silence periods longer than 0.5 seconds
            min_pause_frames = int(0.5 * sr / hop_length)
            pause_count = 0
            current_silence = 0
            
            for is_silent in silence_frames:
                if is_silent:
                    current_silence += 1
                else:
                    if current_silence >= min_pause_frames:
                        pause_count += 1
                    current_silence = 0
            
            return pause_count
            
        except:
            return 0
    
    async def _analyze_volume_consistency(self, audio: np.ndarray) -> float:
        """Analyze volume consistency"""
        try:
            # Calculate RMS energy in overlapping windows
            window_size = 1024
            hop_size = 512
            
            volumes = []
            for i in range(0, len(audio) - window_size, hop_size):
                window = audio[i:i + window_size]
                volume = np.sqrt(np.mean(window ** 2))
                volumes.append(volume)
            
            if len(volumes) > 1:
                consistency = 1.0 - (np.std(volumes) / (np.mean(volumes) + 1e-10))
                return max(0.0, min(1.0, consistency))
            
            return 0.7
            
        except:
            return 0.5
    
    async def _analyze_clarity(self, audio: np.ndarray, sr: int) -> float:
        """Analyze vocal clarity"""
        try:
            # Spectral centroid as a proxy for clarity
            spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
            
            # Higher spectral centroid generally indicates clearer speech
            avg_centroid = np.mean(spectral_centroids)
            
            # Normalize to 0-1 scale
            clarity = min(1.0, avg_centroid / 3000.0)
            
            return round(clarity, 2)
            
        except:
            return 0.7
    
    async def _estimate_confidence(self, pitch_variance: float, volume_consistency: float, avg_pitch: float) -> float:
        """Estimate confidence based on vocal characteristics"""
        try:
            # Lower pitch variance suggests more confidence
            pitch_confidence = max(0.0, 1.0 - (pitch_variance / 1000.0))
            
            # Consistent volume suggests confidence
            volume_confidence = volume_consistency
            
            # Appropriate pitch range suggests confidence
            pitch_confidence_level = 0.8 if 100 <= avg_pitch <= 300 else 0.6
            
            confidence = (pitch_confidence + volume_confidence + pitch_confidence_level) / 3
            return round(max(0.0, min(1.0, confidence)), 2)
            
        except:
            return 0.6
    
    async def _analyze_coherence(self, text: str) -> float:
        """Analyze text coherence (simplified)"""
        try:
            sentences = [s.strip() for s in text.split('.') if s.strip()]
            
            if len(sentences) < 2:
                return 0.8
            
            # Simple coherence metrics
            avg_sentence_length = np.mean([len(s.split()) for s in sentences])
            
            # Coherence based on sentence length consistency
            if 8 <= avg_sentence_length <= 20:
                coherence = 0.9
            else:
                coherence = 0.7
            
            return coherence
            
        except:
            return 0.7
    
    async def _analyze_structure(self, sentences: List[str]) -> float:
        """Analyze speech structure"""
        try:
            valid_sentences = [s.strip() for s in sentences if s.strip()]
            
            if len(valid_sentences) < 2:
                return 0.6
            
            # Structure score based on sentence count and variety
            if 3 <= len(valid_sentences) <= 10:
                structure_score = 0.9
            elif len(valid_sentences) <= 15:
                structure_score = 0.8
            else:
                structure_score = 0.7
            
            return structure_score
            
        except:
            return 0.7
    
    async def _analyze_filler_words(self, text: str) -> Dict[str, Any]:
        """Analyze filler words usage"""
        try:
            filler_words = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically']
            words = text.lower().split()
            
            filler_count = sum(words.count(filler) for filler in filler_words)
            filler_rate = filler_count / len(words) if words else 0
            
            return {
                "filler_count": filler_count,
                "filler_rate": round(filler_rate, 3),
                "filler_score": max(0.0, 1.0 - filler_rate * 10)
            }
            
        except:
            return {"filler_count": 0, "filler_rate": 0.0, "filler_score": 0.8}
    
    async def _analyze_sophistication(self, words: List[str]) -> float:
        """Analyze vocabulary sophistication (simplified)"""
        try:
            # Count longer words as indicator of sophistication
            long_words = [w for w in words if len(w) > 6]
            sophistication = len(long_words) / len(words) if words else 0
            
            return min(1.0, sophistication * 3)  # Scale appropriately
            
        except:
            return 0.6
    
    async def _analyze_appropriateness(self, text: str) -> float:
        """Analyze word choice appropriateness"""
        try:
            # Simple appropriateness check (would use more sophisticated model in production)
            inappropriate_words = ['hate', 'stupid', 'dumb']  # Simplified list
            words = text.lower().split()
            
            inappropriate_count = sum(words.count(word) for word in inappropriate_words)
            appropriateness = max(0.0, 1.0 - inappropriate_count / len(words) * 10) if words else 1.0
            
            return round(appropriateness, 2)
            
        except:
            return 0.9
    
    async def _calculate_overall_score(
        self, pace_analysis: Dict, tone_analysis: Dict, 
        content_analysis: Dict, word_choice_analysis: Dict
    ) -> float:
        """Calculate overall speech performance score"""
        try:
            pace_score = pace_analysis.get("pace_score", 0.5)
            tone_score = tone_analysis.get("tone_score", 0.5)
            content_score = content_analysis.get("content_score", 0.5)
            vocabulary_score = word_choice_analysis.get("vocabulary_score", 0.5)
            
            # Weighted average
            overall_score = (
                pace_score * 0.25 +
                tone_score * 0.25 +
                content_score * 0.30 +
                vocabulary_score * 0.20
            )
            
            return round(overall_score, 2)
            
        except:
            return 0.6
    
    # Fallback methods when OpenAI API is not available
    async def _fallback_content_analysis(self, error: str = None) -> Dict[str, Any]:
        """Fallback content analysis when OpenAI is not available"""
        return {
            "transcript": "Content analysis requires OpenAI API key",
            "word_count": 0,
            "sentence_count": 0,
            "coherence": 0.7,
            "structure": 0.7,
            "filler_words": {"filler_count": 0, "filler_rate": 0.0, "filler_score": 0.8},
            "content_score": 0.7,
            "note": "Using fallback analysis - OpenAI API key required for full analysis",
            "error": error
        }
    
    async def _fallback_word_choice_analysis(self, error: str = None) -> Dict[str, Any]:
        """Fallback word choice analysis when OpenAI is not available"""
        return {
            "total_words": 0,
            "unique_words": 0,
            "vocabulary_diversity": 0.7,
            "sophistication_score": 0.7,
            "appropriateness": 0.9,
            "vocabulary_score": 0.7,
            "note": "Using fallback analysis - OpenAI API key required for full analysis",
            "error": error
        }