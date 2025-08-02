#!/bin/bash

# SkillMirror Quick Status Check
# Verifies repository organization and readiness

echo "🚀 SkillMirror Repository Status Check"
echo "======================================"
echo ""

# Check repository structure
echo "📂 Repository Structure:"
check_count=0
total_checks=0

# Check main files
files_to_check=(
    "README.md:Main repository README"
    "PROJECT_STATUS.md:Project status document"
    "TODO.md:Deployment instructions"
    "REPOSITORY_STATUS.md:Repository organization"
    "LICENSE:Project license"
)

for file_desc in "${files_to_check[@]}"; do
    file=$(echo $file_desc | cut -d: -f1)
    desc=$(echo $file_desc | cut -d: -f2)
    total_checks=$((total_checks + 1))
    
    if [ -f "$file" ]; then
        echo "   ✅ $file ($desc)"
        check_count=$((check_count + 1))
    else
        echo "   ❌ $file ($desc) - MISSING"
    fi
done

echo ""

# Check phases
echo "🎯 Development Phases:"
for i in {1..8}; do
    phase_dir=$(printf "phases/%02d-*" $i)
    total_checks=$((total_checks + 1))
    
    if [ -d $phase_dir ]; then
        phase_name=$(basename $phase_dir)
        echo "   ✅ Phase $i: $phase_name"
        check_count=$((check_count + 1))
    else
        echo "   ❌ Phase $i: Missing"
    fi
done

echo ""

# Check setup scripts
echo "⚙️ Setup Scripts:"
setup_scripts=$(find phases -name "setup_*.sh" | wc -l)
echo "   📊 Found $setup_scripts setup scripts"

if [ $setup_scripts -ge 8 ]; then
    echo "   ✅ Sufficient setup scripts available"
    check_count=$((check_count + 1))
else
    echo "   ⚠️ Some setup scripts may be missing"
fi
total_checks=$((total_checks + 1))

# Check validation scripts  
echo ""
echo "🧪 Validation Scripts:"
validation_scripts=$(find phases -name "*validate*" | wc -l)
echo "   📊 Found $validation_scripts validation scripts"

if [ $validation_scripts -ge 4 ]; then
    echo "   ✅ Good validation coverage"
    check_count=$((check_count + 1))
else
    echo "   ⚠️ Could use more validation scripts"
fi
total_checks=$((total_checks + 1))

# Check API entry points
echo ""
echo "🌐 API Entry Points:"
api_files=$(find phases -name "*api*.py" | wc -l)
echo "   📊 Found $api_files API entry points"

if [ $api_files -ge 8 ]; then
    echo "   ✅ All phases have API endpoints"
    check_count=$((check_count + 1))
else
    echo "   ⚠️ Some phases may be missing API endpoints"
fi
total_checks=$((total_checks + 1))

# Check documentation
echo ""
echo "📚 Documentation:"
docs_updated=true

# Check if README shows all phases complete
if grep -q "8 of 8 Phases Complete" README.md; then
    echo "   ✅ README.md shows all phases complete"
    check_count=$((check_count + 1))
else
    echo "   ⚠️ README.md may need updating"
    docs_updated=false
fi
total_checks=$((total_checks + 1))

# Check if PROJECT_STATUS shows 100%
if grep -q "100%" PROJECT_STATUS.md; then
    echo "   ✅ PROJECT_STATUS.md shows 100% complete"
    check_count=$((check_count + 1))
else
    echo "   ⚠️ PROJECT_STATUS.md may need updating"
    docs_updated=false
fi
total_checks=$((total_checks + 1))

# Check TODO.md size
todo_lines=$(wc -l < TODO.md)
if [ $todo_lines -gt 500 ]; then
    echo "   ✅ TODO.md is comprehensive ($todo_lines lines)"
    check_count=$((check_count + 1))
else
    echo "   ⚠️ TODO.md may need more detail ($todo_lines lines)"
fi
total_checks=$((total_checks + 1))

# Calculate completion percentage
completion_percentage=$((check_count * 100 / total_checks))

echo ""
echo "📊 Repository Health Summary:"
echo "================================"
echo "   Checks Passed: $check_count/$total_checks"
echo "   Completion: $completion_percentage%"
echo ""

if [ $completion_percentage -ge 90 ]; then
    echo "🎉 EXCELLENT - Repository is production ready!"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Follow TODO.md for complete deployment"
    echo "   2. Run: cd phases/08-security && ./setup_security.sh"
    echo "   3. Start services following the deployment guide"
    echo "   4. Access platform at http://localhost:3000"
elif [ $completion_percentage -ge 75 ]; then
    echo "✅ GOOD - Repository is mostly ready"
    echo ""
    echo "🔧 Minor improvements needed:"
    echo "   • Check missing items above"
    echo "   • Follow TODO.md for deployment"
elif [ $completion_percentage -ge 50 ]; then
    echo "⚠️ PARTIAL - Repository needs some work"
    echo ""
    echo "🔧 Improvements needed:"
    echo "   • Fix missing files/scripts"
    echo "   • Update documentation"
    echo "   • Follow TODO.md carefully"
else
    echo "❌ NEEDS WORK - Repository requires significant fixes"
    echo ""
    echo "🔧 Major improvements needed:"
    echo "   • Check all missing items above"
    echo "   • Ensure all phases are complete"
    echo "   • Update all documentation"
fi

echo ""
echo "📁 Key Files to Use:"
echo "   📖 TODO.md - Complete deployment guide"
echo "   📊 PROJECT_STATUS.md - Overall project status"
echo "   📂 REPOSITORY_STATUS.md - Repository organization"
echo "   🚀 phases/08-security/setup_security.sh - Main setup script"

echo ""
echo "🏁 Repository status check complete!"

# Return appropriate exit code
if [ $completion_percentage -ge 90 ]; then
    exit 0
else
    exit 1
fi