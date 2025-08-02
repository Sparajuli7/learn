"""
Encryption Service Module
Handles end-to-end encryption for video data and other sensitive content.
"""

import os
import hashlib
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import base64
import json
from typing import Tuple, Optional, Dict, Any
import tempfile

class VideoEncryptionService:
    """Service for encrypting/decrypting video files and data."""
    
    def __init__(self):
        self.key_size = 256  # AES-256
        self.block_size = 16
    
    def generate_key(self) -> bytes:
        """Generate a new encryption key."""
        return Fernet.generate_key()
    
    def generate_keypair(self) -> Tuple[bytes, bytes]:
        """Generate RSA key pair for asymmetric encryption."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return private_pem, public_pem
    
    def derive_key_from_password(self, password: str, salt: bytes = None) -> Tuple[bytes, bytes]:
        """Derive encryption key from password using PBKDF2."""
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(password.encode())
        return key, salt
    
    def encrypt_file(self, file_path: str, output_path: str, key: bytes = None) -> Dict[str, Any]:
        """Encrypt a file (especially video files) with AES encryption."""
        if key is None:
            key = self.generate_key()
        
        fernet = Fernet(key)
        
        # Read file in chunks to handle large video files
        chunk_size = 64 * 1024  # 64KB chunks
        
        with open(file_path, 'rb') as input_file, open(output_path, 'wb') as output_file:
            while True:
                chunk = input_file.read(chunk_size)
                if not chunk:
                    break
                
                encrypted_chunk = fernet.encrypt(chunk)
                # Write chunk size followed by encrypted chunk
                output_file.write(len(encrypted_chunk).to_bytes(4, 'big'))
                output_file.write(encrypted_chunk)
        
        # Generate file hash for integrity verification
        file_hash = self._calculate_file_hash(file_path)
        
        return {
            "key": base64.b64encode(key).decode(),
            "file_hash": file_hash,
            "encrypted_file": output_path,
            "algorithm": "AES-256-CBC"
        }
    
    def decrypt_file(self, encrypted_path: str, output_path: str, key: str, 
                     expected_hash: str = None) -> bool:
        """Decrypt a file and verify integrity."""
        try:
            key_bytes = base64.b64decode(key.encode())
            fernet = Fernet(key_bytes)
            
            with open(encrypted_path, 'rb') as input_file, open(output_path, 'wb') as output_file:
                while True:
                    # Read chunk size
                    size_bytes = input_file.read(4)
                    if not size_bytes:
                        break
                    
                    chunk_size = int.from_bytes(size_bytes, 'big')
                    encrypted_chunk = input_file.read(chunk_size)
                    
                    if not encrypted_chunk:
                        break
                    
                    decrypted_chunk = fernet.decrypt(encrypted_chunk)
                    output_file.write(decrypted_chunk)
            
            # Verify file integrity if hash provided
            if expected_hash:
                actual_hash = self._calculate_file_hash(output_path)
                return actual_hash == expected_hash
            
            return True
            
        except Exception as e:
            print(f"Decryption failed: {e}")
            return False
    
    def encrypt_data(self, data: bytes, key: bytes = None) -> Dict[str, str]:
        """Encrypt arbitrary data."""
        if key is None:
            key = self.generate_key()
        
        fernet = Fernet(key)
        encrypted_data = fernet.encrypt(data)
        
        return {
            "encrypted_data": base64.b64encode(encrypted_data).decode(),
            "key": base64.b64encode(key).decode()
        }
    
    def decrypt_data(self, encrypted_data: str, key: str) -> Optional[bytes]:
        """Decrypt arbitrary data."""
        try:
            key_bytes = base64.b64decode(key.encode())
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            
            fernet = Fernet(key_bytes)
            decrypted_data = fernet.decrypt(encrypted_bytes)
            
            return decrypted_data
        except Exception as e:
            print(f"Data decryption failed: {e}")
            return None
    
    def encrypt_with_public_key(self, data: bytes, public_key_pem: bytes) -> bytes:
        """Encrypt data with RSA public key."""
        public_key = serialization.load_pem_public_key(public_key_pem)
        
        encrypted_data = public_key.encrypt(
            data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return encrypted_data
    
    def decrypt_with_private_key(self, encrypted_data: bytes, private_key_pem: bytes) -> bytes:
        """Decrypt data with RSA private key."""
        private_key = serialization.load_pem_private_key(
            private_key_pem, 
            password=None
        )
        
        decrypted_data = private_key.decrypt(
            encrypted_data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return decrypted_data
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    def create_secure_temp_file(self, data: bytes, suffix: str = ".tmp") -> str:
        """Create a secure temporary file with encrypted data."""
        # Create temporary file
        temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
        
        try:
            # Encrypt the data
            encryption_result = self.encrypt_data(data)
            
            # Write encrypted data to temp file
            with os.fdopen(temp_fd, 'wb') as temp_file:
                temp_file.write(base64.b64decode(encryption_result["encrypted_data"]))
            
            # Store encryption key securely (in practice, this would be in a key management system)
            key_file = temp_path + ".key"
            with open(key_file, 'w') as kf:
                kf.write(encryption_result["key"])
            
            return temp_path
            
        except Exception as e:
            os.close(temp_fd)
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
    
    def secure_delete_file(self, file_path: str) -> bool:
        """Securely delete a file by overwriting with random data."""
        try:
            if not os.path.exists(file_path):
                return True
            
            file_size = os.path.getsize(file_path)
            
            # Overwrite with random data multiple times
            with open(file_path, 'r+b') as file:
                for _ in range(3):  # 3 passes
                    file.seek(0)
                    file.write(secrets.token_bytes(file_size))
                    file.flush()
                    os.fsync(file.fileno())
            
            # Finally delete the file
            os.unlink(file_path)
            return True
            
        except Exception as e:
            print(f"Secure delete failed: {e}")
            return False


class DataAnonymizer:
    """Service for anonymizing personal data for compliance."""
    
    @staticmethod
    def anonymize_ip_address(ip: str) -> str:
        """Anonymize IP address by masking the last octet."""
        if '.' in ip:  # IPv4
            parts = ip.split('.')
            if len(parts) == 4:
                return f"{parts[0]}.{parts[1]}.{parts[2]}.0"
        elif ':' in ip:  # IPv6
            parts = ip.split(':')
            return ':'.join(parts[:4] + ['0'] * (8 - 4))
        return "0.0.0.0"
    
    @staticmethod
    def anonymize_email(email: str) -> str:
        """Anonymize email address."""
        if '@' in email:
            local, domain = email.split('@', 1)
            if len(local) > 2:
                anonymized_local = local[:2] + '*' * (len(local) - 2)
            else:
                anonymized_local = '*' * len(local)
            return f"{anonymized_local}@{domain}"
        return "****"
    
    @staticmethod
    def anonymize_text_data(text: str, patterns: Dict[str, str] = None) -> str:
        """Anonymize text data by replacing sensitive patterns."""
        import re
        
        if patterns is None:
            patterns = {
                r'\b\d{3}-\d{2}-\d{4}\b': '***-**-****',  # SSN
                r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b': '****-****-****-****',  # Credit card
                r'\b\d{10,11}\b': '**********',  # Phone number
            }
        
        anonymized_text = text
        for pattern, replacement in patterns.items():
            anonymized_text = re.sub(pattern, replacement, anonymized_text)
        
        return anonymized_text
    
    @staticmethod
    def hash_identifier(identifier: str, salt: str = None) -> str:
        """Create a consistent hash for identifiers while maintaining anonymity."""
        if salt is None:
            salt = "default_skillmirror_salt"
        
        combined = f"{identifier}{salt}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]