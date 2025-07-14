// Global variables
let map;
let homeVisitData = [];
let currentSemester = '';
let schoolMarker;
let markersLayer;
let currentFilters = {};
let clusterGroup;
let heatmapLayer;
let allPriorityCases = [];
let filteredPriorityCases = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    populateSemesterDropdown();
    initializeLiff();
    setupEventListeners();
    loadFooter();
    
    // เพิ่มบรรทัดนี้
    initializePriorityModal();
   addTestButton(); // เพิ่มบรรทัดนี้สำหรับทดสอบ
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Auto-refresh data every 5 minutes
    setInterval(() => {
        if (currentSemester) {
            loadMapData(currentSemester);
        }
    }, 300000);
});


///////
// เพิ่ม Modal ลงใน DOM เมื่อ page โหลด
function initializePriorityModal() {
    // Setup event listeners
    setupPriorityModalEventListeners();
}

// Setup Event Listeners สำหรับ Modal
function setupPriorityModalEventListeners() {
    // Search input
    document.getElementById('prioritySearch').addEventListener('input', filterPriorityCases);
    
    // Filter dropdowns
    document.getElementById('priorityLevelFilter').addEventListener('change', filterPriorityCases);
    document.getElementById('priorityClassFilter').addEventListener('change', filterPriorityCases);
    document.getElementById('priorityVisitFilter').addEventListener('change', filterPriorityCases);
    
    // Modal events
    const modal = document.getElementById('priorityCasesModal');
    modal.addEventListener('shown.bs.modal', function() {
        // Focus on search input when modal opens
        document.getElementById('prioritySearch').focus();
        
        // Update data when modal opens
        updatePriorityModalData();
    });
}

// แสดง Modal
function showPriorityCasesModal() {
    const modal = new bootstrap.Modal(document.getElementById('priorityCasesModal'));
    modal.show();
}

// อัปเดตข้อมูลใน Modal
function updatePriorityModalData() {
    if (!homeVisitData || homeVisitData.length === 0) {
        console.warn('No home visit data available');
        return;
    }
    
    document.getElementById('priorityModalLoading').style.display = 'block';
    document.getElementById('priorityTableContainer').style.display = 'none';
    document.getElementById('priorityEmptyState').style.display = 'none';
    
    // สร้างข้อมูล Priority Cases
    allPriorityCases = generateAllPriorityCases();
    
    // Populate class filter
    populatePriorityClassFilter();
    
    // Apply filters and display
    filterPriorityCases();
    
    // Update last update time
    const now = new Date();
    document.getElementById('priorityLastUpdate').textContent = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
    });
    
    setTimeout(() => {
        document.getElementById('priorityModalLoading').style.display = 'none';
        document.getElementById('priorityTableContainer').style.display = 'block';
    }, 500);
}

// สร้างข้อมูล Priority Cases ทั้งหมด
function generateAllPriorityCases() {
    const studentsWithPriority = homeVisitData.map(student => {
        let priority = 0;
        let reasons = [];
        
        // ยังไม่เยี่ยม
        const notVisited = student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว';
        if (notVisited) {
            priority += 3;
            reasons.push('ยังไม่เยี่ยม');
        }
        
        // รายได้
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0 && income < 5000) {
            priority += 3;
            reasons.push('รายได้ต่ำมาก');
        } else if (income >= 5000 && income < 10000) {
            priority += 2;
            reasons.push('รายได้ต่ำ');
        } else if (income >= 10000 && income < 15000) {
            priority += 1;
            reasons.push('รายได้ปานกลาง');
        }
        
        // สวัสดิการ
        if (student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE') {
            priority += 1;
            reasons.push('ได้สวัสดิการ');
        }
        
        // ภาระพึ่งพิง
        if (student['ครัวเรือนมีภาระพึ่งพิง']) {
            priority += 1;
            reasons.push('มีภาระพึ่งพิง');
        }
        
        // ระยะทางไกล
        if (student.distanceFromSchool && student.distanceFromSchool > 5) {
            priority += 2;
            reasons.push('อยู่ไกลโรงเรียน');
        } else if (student.distanceFromSchool && student.distanceFromSchool > 3) {
            priority += 1;
            reasons.push('อยู่ค่อนข้างไกล');
        }
        
        // ปัญหาพิเศษ (ถ้ามี)
        if (student['ปัญหาพิเศษ']) {
            priority += 2;
            reasons.push('มีปัญหาพิเศษ');
        }
        
        // กำหนดระดับความสำคัญ
        let priorityLevel = 'low';
        if (priority >= 6) priorityLevel = 'high';
        else if (priority >= 4) priorityLevel = 'medium';
        
        return {
            ...student,
            priorityScore: priority,
            priorityReasons: reasons,
            priorityLevel: priorityLevel,
            isVisited: !notVisited
        };
    })
    .filter(student => student.priorityScore > 0) // แสดงเฉพาะที่มีคะแนน > 0
    .sort((a, b) => b.priorityScore - a.priorityScore); // เรียงตามคะแนนสูงสุด
    
    return studentsWithPriority;
}

// กรองข้อมูล Priority Cases
function filterPriorityCases() {
    const searchTerm = document.getElementById('prioritySearch').value.toLowerCase();
    const levelFilter = document.getElementById('priorityLevelFilter').value;
    const classFilter = document.getElementById('priorityClassFilter').value;
    const visitFilter = document.getElementById('priorityVisitFilter').value;
    
    filteredPriorityCases = allPriorityCases.filter(student => {
        // ค้นหาชื่อ
        const nameMatch = !searchTerm || 
            (student['ชื่อและนามสกุล'] && student['ชื่อและนามสกุล'].toLowerCase().includes(searchTerm)) ||
            (student['ชื่อเล่น'] && student['ชื่อเล่น'].toLowerCase().includes(searchTerm));
        
        // กรองระดับความสำคัญ
        const levelMatch = !levelFilter || student.priorityLevel === levelFilter;
        
        // กรองห้องเรียน
        const classMatch = !classFilter || student['ห้องเรียน'] === classFilter;
        
        // กรองสถานะการเยี่ยม
        const visitMatch = !visitFilter || 
            (visitFilter === 'visited' && student.isVisited) ||
            (visitFilter === 'notVisited' && !student.isVisited);
        
        return nameMatch && levelMatch && classMatch && visitMatch;
    });
    
    updatePriorityTable();
    updatePriorityStats();
}

// อัปเดตตาราง
function updatePriorityTable() {
    const tableBody = document.getElementById('priorityTableBody');
    const emptyState = document.getElementById('priorityEmptyState');
    const tableContainer = document.getElementById('priorityTableContainer');
    
    if (filteredPriorityCases.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    const rows = filteredPriorityCases.map((student, index) => {
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')).toLocaleString() : 'ไม่ระบุ';
        const visitStatus = student.isVisited ? 
            '<span class="badge bg-success"><i class="fas fa-check"></i> เยี่ยมแล้ว</span>' : 
            '<span class="badge bg-danger"><i class="fas fa-times"></i> ยังไม่เยี่ยม</span>';
        
        let priorityBadge = '';
        let rowClass = '';
        if (student.priorityLevel === 'high') {
            priorityBadge = `<span class="badge bg-danger">${student.priorityScore}</span>`;
            rowClass = 'table-danger';
        } else if (student.priorityLevel === 'medium') {
            priorityBadge = `<span class="badge bg-warning text-dark">${student.priorityScore}</span>`;
            rowClass = 'table-warning';
        } else {
            priorityBadge = `<span class="badge bg-success">${student.priorityScore}</span>`;
        }
        
        return `
            <tr class="${rowClass}">
                <td><strong>${index + 1}</strong></td>
                <td>
                    <div><strong>${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</strong></div>
                    <small class="text-muted">${student['ชื่อเล่น'] || ''}</small>
                </td>
                <td>${student['ห้องเรียน'] || 'ไม่ระบุ'}</td>
                <td>${visitStatus}</td>
                <td>
                    <div class="d-flex flex-wrap gap-1">
                        ${student.priorityReasons.map(reason => 
                            `<span class="badge bg-secondary" style="font-size: 10px;">${reason}</span>`
                        ).join('')}
                    </div>
                </td>
                <td class="text-center">${priorityBadge}</td>
                <td>฿${income}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="focusOnStudentMap('${student['ชื่อและนามสกุล']}')" title="ดูบนแผนที่">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="viewStudentDetails('${student['ชื่อและนามสกุล']}')" title="ดูรายละเอียด">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

// อัปเดตสถิติ
function updatePriorityStats() {
    const total = allPriorityCases.length;
    const high = allPriorityCases.filter(s => s.priorityLevel === 'high').length;
    const medium = allPriorityCases.filter(s => s.priorityLevel === 'medium').length;
    const low = allPriorityCases.filter(s => s.priorityLevel === 'low').length;
    const displayed = filteredPriorityCases.length;
    
    document.getElementById('priorityTotalCount').textContent = total;
    document.getElementById('priorityHighCount').textContent = high;
    document.getElementById('priorityMediumCount').textContent = medium;
    document.getElementById('priorityLowCount').textContent = low;
    document.getElementById('priorityDisplayCount').textContent = displayed;
}

// กรอง Class Filter
function populatePriorityClassFilter() {
    const classSelect = document.getElementById('priorityClassFilter');
    classSelect.innerHTML = '<option value="">ทุกห้อง</option>';
    
    const classes = [...new Set(allPriorityCases.map(student => student['ห้องเรียน']).filter(Boolean))].sort();
    
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.text = className;
        classSelect.appendChild(option);
    });
}

// ล้างตัวกรอง
function clearPriorityFilters() {
    document.getElementById('prioritySearch').value = '';
    document.getElementById('priorityLevelFilter').value = '';
    document.getElementById('priorityClassFilter').value = '';
    document.getElementById('priorityVisitFilter').value = '';
    filterPriorityCases();
}

// รีเฟรชข้อมูล
function refreshPriorityData() {
    updatePriorityModalData();
}

// ส่งออกรายการ
function exportPriorityList() {
    // สร้างข้อมูล CSV
    const headers = ['ลำดับ', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ห้องเรียน', 'สถานะการเยี่ยม', 'สาเหตุ', 'คะแนนความสำคัญ', 'รายได้', 'วันที่เยี่ยม'];
    
    const csvData = filteredPriorityCases.map((student, index) => {
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')).toLocaleString() : 'ไม่ระบุ';
        const visitStatus = student.isVisited ? 'เยี่ยมแล้ว' : 'ยังไม่เยี่ยม';
        
        return [
            index + 1,
            student['ชื่อและนามสกุล'] || 'ไม่ระบุ',
            student['ชื่อเล่น'] || '',
            student['ห้องเรียน'] || 'ไม่ระบุ',
            visitStatus,
            student.priorityReasons.join(', '),
            student.priorityScore,
            income,
            student['วันที่'] || 'ไม่ระบุ'
        ];
    });
    
    // สร้าง CSV content
    const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `รายการความสำคัญ_${new Date().toLocaleDateString('th-TH')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ฟังก์ชันเสริมสำหรับการทำงานร่วมกับแผนที่
function focusOnStudentMap(studentName) {
    // ปิด modal หากเปิดอยู่
    const modal = bootstrap.Modal.getInstance(document.getElementById('priorityCasesModal'));
    if (modal) modal.hide();

    // ค้นหานักเรียน
    const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
    if (!student || !student['LatLongHome']) {
        console.warn('❌ ไม่พบพิกัดของ:', studentName);
        return;
    }

    const [lat, lng] = student['LatLongHome'].split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lng)) {
        console.warn('⚠️ พิกัดไม่ถูกต้อง:', student['LatLongHome']);
        return;
    }

    // ใช้ panTo เพื่อเลื่อนแผนที่โดยไม่เปลี่ยนระดับซูม
    map.panTo([lat, lng], {
        animate: true,
        duration: 0.5
    });

    // หาตัว marker ที่ตรงกับนักเรียนและเปิด popup
    let found = false;
    markersLayer.eachLayer(layer => {
        if (layer.options && layer.options.studentName === studentName) {
            setTimeout(() => {
                // เปิด popup
                layer.openPopup();

                // เพิ่มคลาส shake + แสดง icon ⭐️
                const markerEl = layer.getElement();
                if (markerEl) {
                    markerEl.classList.add('marker-highlight');

                    // ลบคลาสภายหลัง 2 วินาที
                    setTimeout(() => {
                        markerEl.classList.remove('marker-highlight');
                    }, 2000);
                }
            }, 300);
            found = true;
        }
    });

    if (!found) {
        console.warn('❌ ไม่พบ marker สำหรับ:', studentName);
    }
}




// ฟังก์ชันสำหรับแสดงรายละเอียดนักเรียนแบบละเอียด
function showStudentDetailModal(studentName) {
    const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
    if (!student) return;
    
    const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')).toLocaleString() : 'ไม่ระบุ';
    const visitStatus = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว' ? 'เยี่ยมแล้ว' : 'ยังไม่เยี่ยม';
    const welfare = student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE' ? 'ได้รับ' : 'ไม่ได้รับ';
    const distance = student.distanceFromSchool ? `${student.distanceFromSchool.toFixed(2)} กม.` : 'ไม่ทราบ';
    
    const detailModalHTML = `
        <div class="modal fade" id="studentDetailModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user"></i> รายละเอียดนักเรียน
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="fas fa-id-card text-primary"></i> ข้อมูลพื้นฐาน</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>ชื่อ-นามสกุล:</strong></td><td>${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</td></tr>
                                    <tr><td><strong>ชื่อเล่น:</strong></td><td>${student['ชื่อเล่น'] || 'ไม่ระบุ'}</td></tr>
                                    <tr><td><strong>ห้องเรียน:</strong></td><td>${student['ห้องเรียน'] || 'ไม่ระบุ'}</td></tr>
                                    <tr><td><strong>สถานะการเยี่ยม:</strong></td><td>${visitStatus}</td></tr>
                                    <tr><td><strong>วันที่เยี่ยม:</strong></td><td>${student['วันที่'] || 'ไม่ระบุ'}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="fas fa-money-bill-wave text-success"></i> ข้อมูลเศรษฐกิจ</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>รายได้:</strong></td><td>฿${income}</td></tr>
                                    <tr><td><strong>อาชีพผู้ปกครอง:</strong></td><td>${student['อาชีพผู้ปกครอง'] || 'ไม่ระบุ'}</td></tr>
                                    <tr><td><strong>สวัสดิการ:</strong></td><td>${welfare}</td></tr>
                                    <tr><td><strong>การอยู่อาศัย:</strong></td><td>${student['การอยู่อาศัย'] || 'ไม่ระบุ'}</td></tr>
                                    <tr><td><strong>ระยะทางจากโรงเรียน:</strong></td><td>${distance}</td></tr>
                                </table>
                            </div>
                        </div>
                        
                        ${student['ครัวเรือนมีภาระพึ่งพิง'] ? `
                        <div class="alert alert-warning">
                            <h6><i class="fas fa-exclamation-triangle"></i> ภาระพึ่งพิง</h6>
                            <p>${student['ครัวเรือนมีภาระพึ่งพิง']}</p>
                        </div>
                        ` : ''}
                        
                        ${student['หมายเหตุ'] ? `
                        <div class="alert alert-info">
                            <h6><i class="fas fa-sticky-note"></i> หมายเหตุ</h6>
                            <p>${student['หมายเหตุ']}</p>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-primary" onclick="focusOnStudentMap('${studentName}')">
                            <i class="fas fa-map-marker-alt"></i> ดูบนแผนที่
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('studentDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', detailModalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('studentDetailModal'));
    modal.show();
}

// อัปเดตฟังก์ชัน viewStudentDetails
function viewStudentDetails(studentName) {
    showStudentDetailModal(studentName);
}

// ฟังก์ชันสำหรับแสดงสถิติแบบกราฟใน Modal
function showPriorityStatsChart() {
    // สร้างข้อมูลสำหรับกราฟ
    const highCount = allPriorityCases.filter(s => s.priorityLevel === 'high').length;
    const mediumCount = allPriorityCases.filter(s => s.priorityLevel === 'medium').length;
    const lowCount = allPriorityCases.filter(s => s.priorityLevel === 'low').length;
    
    // สร้าง Modal สำหรับแสดงกราฟ
    const chartModalHTML = `
        <div class="modal fade" id="priorityChartModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-pie"></i> สถิติความสำคัญของเคส
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="row mb-4">
                            <div class="col-md-4">
                                <div class="card bg-danger text-white">
                                    <div class="card-body">
                                        <h2>${highCount}</h2>
                                        <p>ความสำคัญสูง</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-warning text-dark">
                                    <div class="card-body">
                                        <h2>${mediumCount}</h2>
                                        <p>ความสำคัญกลาง</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-success text-white">
                                    <div class="card-body">
                                        <h2>${lowCount}</h2>
                                        <p>ความสำคัญต่ำ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="progress mb-3" style="height: 30px;">
                            <div class="progress-bar bg-danger" style="width: ${(highCount/(highCount+mediumCount+lowCount)*100)}%">
                                สูง ${((highCount/(highCount+mediumCount+lowCount)*100)).toFixed(1)}%
                            </div>
                            <div class="progress-bar bg-warning" style="width: ${(mediumCount/(highCount+mediumCount+lowCount)*100)}%">
                                กลาง ${((mediumCount/(highCount+mediumCount+lowCount)*100)).toFixed(1)}%
                            </div>
                            <div class="progress-bar bg-success" style="width: ${(lowCount/(highCount+mediumCount+lowCount)*100)}%">
                                ต่ำ ${((lowCount/(highCount+mediumCount+lowCount)*100)).toFixed(1)}%
                            </div>
                        </div>
                        
                        <p class="text-muted">รวมเคสที่ต้องให้ความสำคัญ: ${allPriorityCases.length} เคส</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing chart modal if any
    const existingChartModal = document.getElementById('priorityChartModal');
    if (existingChartModal) {
        existingChartModal.remove();
    }
    
    // Add new chart modal
    document.body.insertAdjacentHTML('beforeend', chartModalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('priorityChartModal'));
    modal.show();
}
///////

// Setup all event listeners
function setupEventListeners() {
    document.getElementById('semesterDropdown').addEventListener('change', function() {
        currentSemester = this.value;
        loadMapData(currentSemester);
        populateClassFilter();
    });

    document.getElementById('classFilter').addEventListener('change', updateMapWithAllFilters);
    document.getElementById('visitStatusFilter').addEventListener('change', updateMapWithAllFilters);
    document.getElementById('incomeFilter').addEventListener('change', updateMapWithAllFilters);
    document.getElementById('welfareFilter').addEventListener('change', updateMapWithAllFilters);
    document.getElementById('distanceFilter').addEventListener('change', updateMapWithAllFilters);

    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);
    document.getElementById('fontSizeButton').addEventListener('click', toggleFontSize);
    document.getElementById('login-button').addEventListener('click', function() {
        liff.login();
    });
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('share-button').addEventListener('click', shareMapData);

    // Map control buttons
    document.getElementById('showAllBtn').addEventListener('click', () => showMarkersByType('all'));
    document.getElementById('showVisitedBtn').addEventListener('click', () => showMarkersByType('visited'));
    document.getElementById('showNotVisitedBtn').addEventListener('click', () => showMarkersByType('notVisited'));
    document.getElementById('showNearSchoolBtn').addEventListener('click', () => showMarkersByType('nearSchool'));
    document.getElementById('centerMapBtn').addEventListener('click', centerMap);
    document.getElementById('heatmapToggle').addEventListener('click', toggleHeatmap);
    document.getElementById('clusterToggle').addEventListener('click', toggleClustering);

    // Handle navbar collapse
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.navbar-nav') && !e.target.closest('#studentIdSearch')) {
            var navbarCollapse = document.querySelector('.navbar-collapse');
            var bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        }
    });
}

// Initialize Leaflet map
function initializeMap() {
    // Initialize map centered on Nakhon Pathom
    map = L.map('mapid').setView([14.2202, 99.4730], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize marker layers
    markersLayer = L.layerGroup().addTo(map);
    clusterGroup = L.layerGroup();

    // Add school marker
    schoolMarker = L.marker([14.222052, 99.472970], {
        icon: L.divIcon({
            className: 'school-marker',
            html: '<div style="background-color: #007bff; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="fas fa-school" style="color: white; font-size: 10px;"></i></div>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    
    schoolMarker.bindPopup(`
        <div style="text-align: center;">
            <h6><i class="fas fa-school"></i> โรงเรียน</h6>
            <p>ตำแหน่งโรงเรียน</p>
            <small>พิกัด: 14.222052, 99.472970</small>
        </div>
    `);

    // Add map event listeners
    map.on('mousemove', function(e) {
        document.getElementById('mouseCoords').textContent = 
            `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
    });

    map.on('zoomend', function() {
        document.getElementById('zoomLevel').textContent = map.getZoom();
    });

    map.on('click', function(e) {
        document.getElementById('mapInfo').style.display = 'block';
    });
}

// Populate semester dropdown from API
async function populateSemesterDropdown() {
    try {
        const response = await fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ปีการศึกษา');
        const data = await response.json();
        const dropdown = document.getElementById('semesterDropdown');
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item['ปีการศึกษา'];
            option.text = item['ปีการศึกษา'];
            dropdown.appendChild(option);
        });

        if (data.length > 0) {
            currentSemester = data[0]['ปีการศึกษา'];
            loadMapData(currentSemester);
        }
    } catch (error) {
        console.error('Error loading semester data:', error);
    }
}

// Load map data from API
async function loadMapData(semester) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('mapid').style.display = 'none';
        
        const response = await fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ข้อมูลเยี่ยมบ้าน');
        const data = await response.json();
        
        // Filter data by semester
        homeVisitData = data.filter(item => item['ภาคเรียนที่'] === semester);
        
        // Calculate distances from school
        homeVisitData.forEach(student => {
            student.distanceFromSchool = calculateDistance(student);
        });

        updateMapMarkers();
        updateStatistics();
        updateAdvancedStatistics();
        updateRecentActivities();
        updatePriorityCases();
        populateClassFilter();
        
        // Center map on school after data is loaded
        centerMapOnSchool();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mapid').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading map data:', error);
        document.getElementById('loading').innerHTML = '<div class="alert alert-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    }
}

// Calculate distance between student home and school
function calculateDistance(student) {
    const latLong = student['LatLongHome'];
    if (!latLong || !latLong.includes(',')) return null;
    
    const [lat, lng] = latLong.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lng)) return null;
    
    const schoolLat = 14.222052;
    const schoolLng = 99.472970;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat - schoolLat) * Math.PI / 180;
    const dLng = (lng - schoolLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(schoolLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Update advanced statistics
function updateAdvancedStatistics() {
    // Get current time in Thailand timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Today's visits - แก้ไขให้ถูกต้อง
    const todayVisits = homeVisitData.filter(student => {
        if (!student['วันที่'] || student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว') return false;
        const visitDate = parseThaiDateFromCurrentDateTime(student['วันที่']);
        if (!visitDate) return false;
        
        // เปรียบเทียบแค่วันที่ (ไม่รวมเวลา)
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return visitDateOnly.getTime() === todayOnly.getTime();
    }).length;
    
    // This week's visits
    const thisWeekVisits = homeVisitData.filter(student => {
        if (!student['วันที่'] || student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว') return false;
        const visitDate = parseThaiDateFromCurrentDateTime(student['วันที่']);
        return visitDate && visitDate >= oneWeekAgo && visitDate <= now;
    }).length;
    
    // Average income
    const incomes = homeVisitData
        .map(student => student['รายได้'])
        .filter(income => income)
        .map(income => parseFloat(income.replace(/[฿,]/g, '')))
        .filter(income => !isNaN(income));
    const avgIncome = incomes.length > 0 ? 
        (incomes.reduce((sum, income) => sum + income, 0) / incomes.length).toFixed(0) : 0;
    
    // Welfare recipients
    const welfareCount = homeVisitData.filter(student => student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE').length;
    
    // Urgent cases (low income + not visited + welfare recipient)
    const urgentCases = homeVisitData.filter(student => {
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        const isLowIncome = income > 0 && income < 10000;
        const notVisited = student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว';
        const hasWelfare = student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE';
        return isLowIncome && notVisited && hasWelfare;
    }).length;
    
    // Average distance
    const distances = homeVisitData
        .map(student => student.distanceFromSchool)
        .filter(distance => distance !== null && !isNaN(distance));
    const avgDistance = distances.length > 0 ? 
        (distances.reduce((sum, distance) => sum + distance, 0) / distances.length).toFixed(1) : 0;
    
    // Update DOM
    document.getElementById('todayVisits').textContent = todayVisits;
    document.getElementById('thisWeekVisits').textContent = thisWeekVisits;
    document.getElementById('avgIncome').textContent = parseInt(avgIncome).toLocaleString();
    document.getElementById('welfareCount').textContent = welfareCount;
    document.getElementById('urgentCases').textContent = urgentCases;
    document.getElementById('avgDistance').textContent = avgDistance;
}

// Parse Thai date format specifically for "currentDateTime" format
function parseThaiDateFromCurrentDateTime(dateTimeStr) {
    try {
        // Handle format like "วันพฤหัสบดีที่ 19 มิถุนายน พ.ศ. 2568 เวลา 16:59:27"
        if (dateTimeStr.includes('วัน') && dateTimeStr.includes('เวลา')) {
            // Extract date and time parts
            const parts = dateTimeStr.split(' เวลา ');
            if (parts.length === 2) {
                const datePart = parts[0];
                const timePart = parts[1];
                
                // Extract day, month, year
                const dateMatch = datePart.match(/(\d+)\s+(\S+)\s+พ\.ศ\.\s+(\d+)/);
                if (dateMatch) {
                    const day = parseInt(dateMatch[1]);
                    const monthName = dateMatch[2];
                    const year = parseInt(dateMatch[3]) - 543; // Convert Buddhist to Christian year
                    
                    // Thai month names to numbers
                    const thaiMonths = {
                        'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
                        'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
                        'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
                    };
                    
                    const month = thaiMonths[monthName];
                    if (month !== undefined) {
                        // Parse time
                        const [hour, minute, second] = timePart.split(':').map(num => parseInt(num));
                        // สร้าง Date object ใน timezone ปัจจุบัน (ไทย)
                        return new Date(year, month, day, hour || 0, minute || 0, second || 0);
                    }
                }
            }
        }
        
        // Fallback to original date format "19/6/2568, 16:59:27"
        return parseThaiDate(dateTimeStr);
    } catch (error) {
        console.error('Error parsing currentDateTime format:', dateTimeStr, error);
        return null;
    }
}

// Parse Thai date format and convert to Thailand timezone
function parseThaiDate(dateStr) {
    try {
        // Parse Thai date format "19/6/2568, 16:59:27"
        const [datePart, timePart] = dateStr.split(', ');
        const [day, month, year] = datePart.split('/').map(num => parseInt(num));
        
        if (day && month && year) {
            // Convert Buddhist year to Christian year
            const christianYear = year - 543;
            
            // If time part exists, parse it
            if (timePart) {
                const [hour, minute, second] = timePart.split(':').map(num => parseInt(num));
                // สร้าง Date object ใน timezone ปัจจุบัน (ไทย)
                return new Date(christianYear, month - 1, day, hour || 0, minute || 0, second || 0);
            } else {
                // Only date without time
                return new Date(christianYear, month - 1, day);
            }
        }
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
    }
    return null;
}

// Update recent activities panel
function updateRecentActivities() {
    const recentContainer = document.getElementById('recentActivities');
    
    // Get recent visits (last 5) - sorted by Thailand time
    const recentVisits = homeVisitData
        .filter(student => student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว' && student['วันที่'])
        .sort((a, b) => {
            const dateA = parseThaiDateFromCurrentDateTime(a['วันที่']);
            const dateB = parseThaiDateFromCurrentDateTime(b['วันที่']);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB - dateA; // Sort descending (newest first)
        })
        .slice(0, 5);
    
    if (recentVisits.length === 0) {
        recentContainer.innerHTML = '<div class="text-muted text-center">ยังไม่มีกิจกรรมการเยี่ยมบ้าน</div>';
        return;
    }
    
    const activitiesHtml = recentVisits.map(student => {
        const visitDate = parseThaiDateFromCurrentDateTime(student['วันที่']);
        const timeAgo = getTimeAgo(visitDate);
        const formattedDate = visitDate ? visitDate.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Bangkok'
        }) : 'ไม่ทราบวันที่';
        
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background-color: #28a745; color: white;">
                    <i class="fas fa-check"></i>
                </div>
                <div class="activity-content">
                    <div><strong>${student['ชื่อและนามสกุล']}</strong> (${student['ห้องเรียน']})</div>
                    <div class="activity-time">${timeAgo} - ${formattedDate}</div>
                </div>
            </div>
        `;
    }).join('');
    
    recentContainer.innerHTML = activitiesHtml;
}

// Update priority cases panel
function updatePriorityCases() {
    const priorityContainer = document.getElementById('priorityCases');
    
    // Calculate priority scores (ใช้โค้ดเดิม)
    const studentsWithPriority = homeVisitData.map(student => {
        let priority = 0;
        let reasons = [];
        
        // Not visited yet
        if (student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว') {
            priority += 3;
            reasons.push('ยังไม่เยี่ยม');
        }
        
        // Low income
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0 && income < 5000) {
            priority += 3;
            reasons.push('รายได้ต่ำ');
        } else if (income >= 5000 && income < 10000) {
            priority += 2;
            reasons.push('รายได้ปานกลาง');
        }
        
        // Has welfare
        if (student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE') {
            priority += 1;
            reasons.push('ได้สวัสดิการ');
        }
        
        // Family burden
        if (student['ครัวเรือนมีภาระพึ่งพิง']) {
            priority += 1;
            reasons.push('มีภาระพึ่งพิง');
        }
        
        // Far from school
        if (student.distanceFromSchool && student.distanceFromSchool > 5) {
            priority += 1;
            reasons.push('อยู่ไกลโรงเรียน');
        }
        
        return {
            ...student,
            priorityScore: priority,
            priorityReasons: reasons
        };
    });
    
    // Sort by priority and get top 5
    const topPriority = studentsWithPriority
        .filter(student => student.priorityScore > 0)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 5);
    
    if (topPriority.length === 0) {
        priorityContainer.innerHTML = '<div class="text-muted text-center">ไม่มีเคสที่ต้องให้ความสำคัญพิเศษ</div>';
        return;
    }
    
    const priorityHtml = topPriority.map(student => {
        const priorityClass = student.priorityScore >= 6 ? 'high' : student.priorityScore >= 4 ? 'medium' : 'low';
        
        return `
            <div class="priority-item ${priorityClass}">
                <div><strong>${student['ชื่อและนามสกุล']}</strong> (${student['ห้องเรียน']})</div>
                <div style="font-size: 11px; margin-top: 3px;">
                    ${student.priorityReasons.join(', ')}
                </div>
                <div style="font-size: 10px; color: #666; margin-top: 2px;">
                    คะแนน: ${student.priorityScore}
                </div>
            </div>
        `;
    }).join('');
    
    // เพิ่มสรุปจำนวนทั้งหมด
    const totalCases = studentsWithPriority.filter(s => s.priorityScore > 0).length;
    const showingText = totalCases > 5 ? `<div class="text-center mt-2"><small class="text-muted">แสดง 5 จาก ${totalCases} เคส</small></div>` : '';
    
    priorityContainer.innerHTML = priorityHtml + showingText;
}

// Get time ago text relative to Thailand timezone
function getTimeAgo(date) {
    if (!date) return 'ไม่ทราบเวลา';
    
    // Get current time - ใช้เวลาปัจจุบันตรงๆ
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays === 0) {
        if (diffHours === 0) {
            return diffMins <= 0 ? 'เพิ่งเยี่ยม' : `${diffMins} นาทีที่แล้ว`;
        }
        return `${diffHours} ชั่วโมงที่แล้ว`;
    } else if (diffDays === 1) {
        return 'เมื่อวาน';
    } else if (diffDays < 7) {
        return `${diffDays} วันที่แล้ว`;
    } else {
        // Format date in Thai locale
        return date.toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            timeZone: 'Asia/Bangkok'
        });
    }
}

// Update map with all applied filters
function updateMapWithAllFilters() {
    let filteredData = homeVisitData;
    
    // Apply all filters
    const classFilter = document.getElementById('classFilter').value;
    const visitStatusFilter = document.getElementById('visitStatusFilter').value;
    const incomeFilter = document.getElementById('incomeFilter').value;
    const welfareFilter = document.getElementById('welfareFilter').value;
    const distanceFilter = document.getElementById('distanceFilter').value;
    
    if (classFilter) {
        filteredData = filteredData.filter(student => student['ห้องเรียน'] === classFilter);
    }
    
    if (visitStatusFilter) {
        if (visitStatusFilter === 'เยี่ยมแล้ว') {
            filteredData = filteredData.filter(student => student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว');
        } else if (visitStatusFilter === 'ยังไม่เยี่ยม') {
            filteredData = filteredData.filter(student => 
                student['สถานการณ์เยี่ยม'] === 'ยังไม่ได้เยี่ยม' || 
                student['สถานการณ์เยี่ยม'] === 'ยังไม่เยี่ยม' ||
                student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว'
            );
        }
    }
    
    if (incomeFilter) {
        const maxIncome = parseFloat(incomeFilter);
        filteredData = filteredData.filter(student => {
            const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
            return income > 0 && income < maxIncome;
        });
    }
    
    if (welfareFilter) {
        filteredData = filteredData.filter(student => student['ได้สวัสดิการแห่งรัฐ'] === welfareFilter);
    }
    
    if (distanceFilter) {
        const maxDistance = parseFloat(distanceFilter);
        filteredData = filteredData.filter(student => 
            student.distanceFromSchool && student.distanceFromSchool < maxDistance
        );
    }
    
    updateMarkersWithData(filteredData);
    updateStatisticsWithData(filteredData);
}

// Update markers on map with given data
function updateMarkersWithData(data) {
    // Clear existing markers
    markersLayer.clearLayers();
    
data.forEach(student => {
    const latLong = student['LatLongHome'];
    if (latLong && latLong.includes(',')) {
        const [lat, lng] = latLong.split(',').map(coord => parseFloat(coord.trim()));
        const marker = createStudentMarker(student, lat, lng);
        if (marker) {
            markersLayer.addLayer(marker);
        } else {
            console.warn('❌ ไม่สามารถสร้าง marker:', student['ชื่อและนามสกุล']);
        }
    } else {
        console.warn('⚠️ ไม่มีพิกัด LatLong:', student['ชื่อและนามสกุล']);
    }
});

}

// Create marker for student
function createStudentMarker(student, lat, lng) {
    // ตรวจสอบความถูกต้องของข้อมูล lat/lng
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.warn('❌ LatLng ผิดพลาด:', student['ชื่อและนามสกุล'], student['LatLongHome']);
        return null;
    }

    const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
    const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
    const hasWelfare = student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE';
    const isLowIncome = income > 0 && income < 10000;

    let markerColor = isVisited ? '#28a745' : '#dc3545';
    let borderColor = 'white';
    let markerSize = 15;

    // เคสเร่งด่วน
    if (!isVisited && isLowIncome && hasWelfare) {
        borderColor = '#ffc107';
        markerSize = 18;
        markerColor = 'linear-gradient(45deg, #dc3545, #ffc107)';
    }

    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'student-marker',
            html: `
                <div style="
                    background: ${markerColor};
                    width: ${markerSize}px;
                    height: ${markerSize}px;
                    border-radius: 50%;
                    border: 2px solid ${borderColor};
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                    ${!isVisited ? 'animation: pulse 2s infinite;' : ''}
                "></div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize/2, markerSize/2]
        }),
        type: 'student',
        studentName: student['ชื่อและนามสกุล'] || 'ไม่ทราบชื่อ'
    });

    const popupContent = createEnhancedPopupContent(student);
    if (!popupContent) {
        console.warn('⚠️ popupContent ไม่มีข้อมูล:', student['ชื่อและนามสกุล']);
    }

    marker.bindPopup(popupContent, {
        autoPan: false,
        keepInView: false,
        maxWidth: 300
    });

    return marker;
}


// ฟังก์ชันสำหรับทดสอบ Modal
function testPriorityModal() {
    console.log('Testing Priority Modal...');
    console.log('Home visit data length:', homeVisitData?.length || 0);
    console.log('Current semester:', currentSemester);
    
    if (homeVisitData && homeVisitData.length > 0) {
        showPriorityCasesModal();
    } else {
        console.warn('No data available for testing');
        alert('กรุณาโหลดข้อมูลก่อนทดสอบ Modal');
    }
}

// เพิ่มปุ่มทดสอบ (สำหรับ development)
function addTestButton() {
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Priority Modal';
    testBtn.className = 'btn btn-warning btn-sm';
    testBtn.style.position = 'fixed';
    testBtn.style.top = '100px';
    testBtn.style.right = '20px';
    testBtn.style.zIndex = '9999';
    testBtn.onclick = testPriorityModal;
    
    // เพิ่มเฉพาะใน development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        document.body.appendChild(testBtn);
    }
}

// Create enhanced popup content for markers
function createEnhancedPopupContent(student) {
    const visitStatus = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว' ? 
        '<span class="badge bg-success"><i class="fas fa-check"></i> เยี่ยมแล้ว</span>' : 
        '<span class="badge bg-danger"><i class="fas fa-times"></i> ยังไม่เยี่ยม</span>';
    
    const visitDate = student['วันที่'] || 'ไม่ระบุ';
    const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')).toLocaleString() : 'ไม่ระบุ';
    const welfare = student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE' ? 
        '<span class="badge bg-info">ได้รับ</span>' : 
        '<span class="badge bg-secondary">ไม่ได้รับ</span>';
    const distance = student.distanceFromSchool ? 
        `${student.distanceFromSchool.toFixed(2)} กม.` : 'ไม่ทราบ';
    
    return `
        <div style="min-width: 280px;">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0"><i class="fas fa-user"></i> ${student['ชื่อและนามสกุล']}</h6>
                ${visitStatus}
            </div>
            
            <div class="row g-2 mb-2">
                <div class="col-6"><small><strong>ชื่อเล่น:</strong><br>${student['ชื่อเล่น'] || 'ไม่ระบุ'}</small></div>
                <div class="col-6"><small><strong>ห้องเรียน:</strong><br>${student['ห้องเรียน'] || 'ไม่ระบุ'}</small></div>
            </div>
            
            <div class="row g-2 mb-2">
                <div class="col-6"><small><strong>วันที่เยี่ยม:</strong><br>${visitDate}</small></div>
                <div class="col-6"><small><strong>ระยะทาง:</strong><br>${distance}</small></div>
            </div>
            
            <div class="row g-2 mb-2">
                <div class="col-6"><small><strong>รายได้:</strong><br>฿${income}</small></div>
                <div class="col-6"><small><strong>สวัสดิการ:</strong><br>${welfare}</small></div>
            </div>
            
            <div class="mb-2">
                <small><strong>อาชีพผู้ปกครอง:</strong><br>${student['อาชีพผู้ปกครอง'] || 'ไม่ระบุ'}</small>
            </div>
            
            <div class="mb-2">
                <small><strong>การอยู่อาศัย:</strong><br>${student['การอยู่อาศัย'] || 'ไม่ระบุ'}</small>
            </div>
            
            ${student['ครัวเรือนมีภาระพึ่งพิง'] ? 
                `<div class="alert alert-warning p-2 mb-0" style="font-size: 11px;">
                    <i class="fas fa-exclamation-triangle"></i> ภาระพึ่งพิง: ${student['ครัวเรือนมีภาระพึ่งพิง']}
                </div>` : ''
            }
        </div>
    `;
}

// Show markers by type (all, visited, not visited, near school)
function showMarkersByType(type) {
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    
    let filteredData = homeVisitData;
    
    switch(type) {
        case 'visited':
            filteredData = homeVisitData.filter(student => student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว');
            document.getElementById('showVisitedBtn').classList.add('active');
            break;
        case 'notVisited':
            filteredData = homeVisitData.filter(student => 
                student['สถานการณ์เยี่ยม'] === 'ยังไม่ได้เยี่ยม' || 
                student['สถานการณ์เยี่ยม'] === 'ยังไม่เยี่ยม' ||
                student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว'
            );
            document.getElementById('showNotVisitedBtn').classList.add('active');
            break;
        case 'nearSchool':
            filteredData = homeVisitData.filter(student => 
                student.distanceFromSchool && student.distanceFromSchool < 2
            );
            document.getElementById('showNearSchoolBtn').classList.add('active');
            break;
        default:
            document.getElementById('showAllBtn').classList.add('active');
    }
    
    updateMarkersWithData(filteredData);
    updateStatisticsWithData(filteredData);
}

// Center map to school position with appropriate zoom
function centerMapOnSchool() {
    // Center on school location
    const schoolLat = 14.222052;
    const schoolLng = 99.472970;
    
    // Calculate bounds to include all student homes
    if (homeVisitData.length > 0) {
        const validCoords = homeVisitData
            .map(student => {
                const latLong = student['LatLongHome'];
                if (latLong && latLong.includes(',')) {
                    const [lat, lng] = latLong.split(',').map(coord => parseFloat(coord.trim()));
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return [lat, lng];
                    }
                }
                return null;
            })
            .filter(coord => coord !== null);
        
        if (validCoords.length > 0) {
            // Add school coordinates to bounds
            validCoords.push([schoolLat, schoolLng]);
            
            // Create bounds and fit map
            const group = L.featureGroup();
            validCoords.forEach(coord => {
                group.addLayer(L.marker(coord));
            });
            
            // Fit bounds with padding
            map.fitBounds(group.getBounds(), {
                padding: [20, 20],
                maxZoom: 15
            });
        } else {
            // Fallback to school location if no student coordinates
            map.setView([schoolLat, schoolLng], 13);
        }
    } else {
        // Default to school location
        map.setView([schoolLat, schoolLng], 13);
    }
}

// Center map to initial position (keep existing function)
function centerMap() {
    centerMapOnSchool();
    document.getElementById('mapInfo').style.display = 'none';
}

// Toggle heatmap (placeholder for future implementation)
function toggleHeatmap() {
    const btn = document.getElementById('heatmapToggle');
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        // Remove heatmap
    } else {
        btn.classList.add('active');
        // Add heatmap
    }
}

// Toggle clustering
function toggleClustering() {
    const btn = document.getElementById('clusterToggle');
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        map.removeLayer(clusterGroup);
        map.addLayer(markersLayer);
    } else {
        btn.classList.add('active');
        map.removeLayer(markersLayer);
        // Move markers to cluster group
        clusterGroup.clearLayers();
        markersLayer.eachLayer(layer => {
            clusterGroup.addLayer(layer);
        });
        map.addLayer(clusterGroup);
    }
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('classFilter').value = '';
    document.getElementById('visitStatusFilter').value = '';
    document.getElementById('incomeFilter').value = '';
    document.getElementById('welfareFilter').value = '';
    document.getElementById('distanceFilter').value = '';
    
    updateMapWithAllFilters();
}

// Update statistics with filtered data
function updateStatisticsWithData(data) {
    const visited = data.filter(student => student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว').length;
    const total = data.length;
    const notVisited = total - visited;
    const percentage = total > 0 ? ((visited / total) * 100).toFixed(1) : 0;

    document.getElementById('visitedCount').textContent = visited;
    document.getElementById('notVisitedCount').textContent = notVisited;
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('visitPercentage').textContent = percentage + '%';
}

// Wrapper functions for backward compatibility
function updateMapMarkers() {
    updateMarkersWithData(homeVisitData);
}

function updateStatistics() {
    updateStatisticsWithData(homeVisitData);
}

function populateClassFilter() {
    const classSelect = document.getElementById('classFilter');
    classSelect.innerHTML = '<option value="">ทุกห้องเรียน</option>';
    
    const classes = [...new Set(homeVisitData.map(student => student['ห้องเรียน']).filter(Boolean))].sort();
    
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.text = className;
        classSelect.appendChild(option);
    });
}

// LIFF Functions
async function initializeLiff() {
    try {
        await liff.init({ liffId: '2005494853-ZDznGqqe' });
        if (liff.isLoggedIn()) {
            displayUserInfo();
            document.getElementById('login-button').style.display = 'none';
        }
    } catch (error) {
        console.error('LIFF initialization failed', error);
    }
}

async function displayUserInfo() {
    try {
        const profile = await liff.getProfile();
        document.getElementById('profile-name').textContent = profile.displayName;
        document.getElementById('profile-picture').src = profile.pictureUrl;
        document.getElementById('profile-picture').style.display = 'inline';
        document.getElementById('logout-button').style.display = 'inline-block';
        document.getElementById('share-button').style.display = 'inline-block';
    } catch (error) {
        console.error('Error getting profile:', error);
    }
}

function shareMapData() {
    if (!liff.isLoggedIn()) {
        alert('กรุณาเข้าสู่ระบบก่อนแชร์ข้อมูล');
        return;
    }

    const visited = document.getElementById('visitedCount').textContent;
    const notVisited = document.getElementById('notVisitedCount').textContent;
    const total = document.getElementById('totalStudents').textContent;
    const percentage = document.getElementById('visitPercentage').textContent;
    const selectedClass = document.getElementById('classFilter').value || 'ทุกห้องเรียน';
    
    // Use Thailand timezone for sharing
    const currentDateTime = new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'long',
        hour12: false,
        timeZone: 'Asia/Bangkok'
    });

    const profilePicture = document.getElementById('profile-picture').src;
    const profileName = document.getElementById('profile-name').textContent;

    const flexMessage = {
        type: "flex",
        altText: "สถิติการเยี่ยมบ้านนักเรียน",
        contents: {
            type: "bubble",
            size: "giga",
            hero: {
                type: "image",
                url: "https://raw.githubusercontent.com/infobwd/STUDENT-CARE/main/headStudentCare2.png",
                size: "full",
                aspectRatio: "40:10",
                aspectMode: "cover"
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "📍 สถิติการเยี่ยมบ้านนักเรียน",
                        weight: "bold",
                        size: "lg",
                        color: "#003366"
                    },
                    {
                        type: "separator",
                        margin: "md"
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "ปีการศึกษา",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 4
                                    },
                                    {
                                        type: "text",
                                        text: currentSemester,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 6
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "ห้องเรียน",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 4
                                    },
                                    {
                                        type: "text",
                                        text: selectedClass,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 6
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "✅ เยี่ยมแล้ว",
                                        color: "#28a745",
                                        size: "sm",
                                        flex: 4,
                                        weight: "bold"
                                    },
                                    {
                                        type: "text",
                                        text: visited + " คน",
                                        wrap: true,
                                        color: "#28a745",
                                        size: "sm",
                                        flex: 6,
                                        weight: "bold"
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "❌ ยังไม่เยี่ยม",
                                        color: "#dc3545",
                                        size: "sm",
                                        flex: 4,
                                        weight: "bold"
                                    },
                                    {
                                        type: "text",
                                        text: notVisited + " คน",
                                        wrap: true,
                                        color: "#dc3545",
                                        size: "sm",
                                        flex: 6,
                                        weight: "bold"
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "📊 เปอร์เซ็นต์",
                                        color: "#007bff",
                                        size: "sm",
                                        flex: 4,
                                        weight: "bold"
                                    },
                                    {
                                        type: "text",
                                        text: percentage,
                                        wrap: true,
                                        color: "#007bff",
                                        size: "lg",
                                        flex: 6,
                                        weight: "bold"
                                    }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "👥 รวมทั้งหมด",
                                        color: "#6c757d",
                                        size: "sm",
                                        flex: 4
                                    },
                                    {
                                        type: "text",
                                        text: total + " คน",
                                        wrap: true,
                                        color: "#6c757d",
                                        size: "sm",
                                        flex: 6
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "separator",
                        margin: "sm"
                    },
                    {
                        type: "image",
                        url: profilePicture,
                        size: "sm",
                        aspectMode: "cover",
                        aspectRatio: "1:1",
                        gravity: "bottom",
                        margin: "md"
                    },
                    {
                        type: "text",
                        text: "ข้อมูลโดย : " + profileName,
                        weight: "bold",
                        size: "sm",
                        align: "center"
                    },
                    {
                        type: "text",
                        text: "ข้อมูล ณ. " + currentDateTime,
                        size: "xs",
                        color: "#aaaaaa",
                        align: "center"
                    },
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "ดูแผนที่เต็ม",
                            uri: "https://liff.line.me/2005494853-ZDznGqqe/map.html"
                        },
                        color: "#003366",
                        margin: "md"
                    }
                ],
                spacing: "sm",
                paddingTop: "10px"
            }
        }
    };

    liff.shareTargetPicker([flexMessage])
        .then(() => {
            console.log('Message shared successfully');
        })
        .catch(function (error) {
            console.error('Error sending message: ', error);
            alert('เกิดข้อผิดพลาดในการแชร์ข้อมูล');
        });
}

function logout() {
    liff.logout();
    window.location.reload();
}

// Utility Functions
function chatFunction() {
    window.open('https://line.me/R/ti/p/@747spikt', '_blank');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById('fullscreenButton').textContent = 'ย่อขนาดจอ';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            document.getElementById('fullscreenButton').textContent = 'ขยายเต็มจอ';
        }
    }
}

function toggleFontSize() {
    let currentSize = parseInt(window.getComputedStyle(document.body).fontSize);
    if (currentSize === 16) {
        document.body.style.fontSize = '20px';
    } else if (currentSize === 20) {
        document.body.style.fontSize = '24px';
    } else {
        document.body.style.fontSize = '16px';
    }
}

function updateDateTime() {
    // Update with Thailand timezone
    const currentDateTime = new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'long',
        hour12: false,
        timeZone: 'Asia/Bangkok'
    });
    document.getElementById('currentDateTime').textContent = currentDateTime;
}

// Load footer content
function loadFooter() {
    // Check if jQuery is available, if not use fetch
    if (typeof $ !== 'undefined') {
        $("#footer-container").load("footer.html");
    } else {
        // Fallback using fetch
        fetch('footer.html')
            .then(response => response.text())
            .then(html => {
                const footerContainer = document.getElementById('footer-container');
                if (footerContainer) {
                    footerContainer.innerHTML = html;
                }
            })
            .catch(error => {
                console.log('Footer not found, using default footer');
                // Create default footer if footer.html not found
                createDefaultFooter();
            });
    }
}
