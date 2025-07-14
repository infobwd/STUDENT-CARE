// =================================================================
// 📋 PRIORITY CASES MODAL SYSTEM
// =================================================================

// Global variables สำหรับ Modal
let allPriorityCases = [];
let filteredPriorityCases = [];

// Priority Modal HTML Template
const priorityModalHTML = `
<!-- Priority Cases Modal -->
<div class="modal fade" id="priorityCasesModal" tabindex="-1" aria-labelledby="priorityCasesModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="priorityCasesModalLabel">
                    <i class="fas fa-exclamation-triangle"></i> รายการนักเรียนตามลำดับความสำคัญ
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Filters -->
                <div class="row mb-3">
                    <div class="col-md-3">
                        <label class="form-label">ค้นหาชื่อนักเรียน:</label>
                        <input type="text" id="prioritySearch" class="form-control" placeholder="พิมพ์ชื่อหรือนามสกุล...">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">ระดับความสำคัญ:</label>
                        <select id="priorityLevelFilter" class="form-select">
                            <option value="">ทุกระดับ</option>
                            <option value="high">สูง (≥6)</option>
                            <option value="medium">กลาง (4-5)</option>
                            <option value="low">ต่ำ (1-3)</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">ห้องเรียน:</label>
                        <select id="priorityClassFilter" class="form-select">
                            <option value="">ทุกห้อง</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">สถานะการเยี่ยม:</label>
                        <select id="priorityVisitFilter" class="form-select">
                            <option value="">ทั้งหมด</option>
                            <option value="notVisited">ยังไม่เยี่ยม</option>
                            <option value="visited">เยี่ยมแล้ว</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">การดำเนินการ:</label>
                        <div class="btn-group w-100" role="group">
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="clearPriorityFilters()">
                                <i class="fas fa-times"></i> ล้าง
                            </button>
                            <button type="button" class="btn btn-outline-success btn-sm" onclick="exportPriorityList()">
                                <i class="fas fa-download"></i> ส่งออก
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="row mb-3">
                    <div class="col-md-12">
                        <div class="alert alert-info d-flex justify-content-between align-items-center">
                            <div>
                                <strong>สรุปข้อมูล:</strong> 
                                <span id="priorityTotalCount">0</span> เคสทั้งหมด | 
                                <span class="text-danger">ความสำคัญสูง: <span id="priorityHighCount">0</span></span> | 
                                <span class="text-warning">กลาง: <span id="priorityMediumCount">0</span></span> | 
                                <span class="text-success">ต่ำ: <span id="priorityLowCount">0</span></span>
                            </div>
                            <div>
                                <small>แสดง <span id="priorityDisplayCount">0</span> รายการ</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Loading -->
                <div id="priorityModalLoading" class="text-center py-4" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">กำลังโหลด...</span>
                    </div>
                    <p class="mt-2">กำลังโหลดข้อมูล...</p>
                </div>

                <!-- Table -->
                <div id="priorityTableContainer" class="table-responsive">
                    <table class="table table-hover table-sm">
                        <thead class="table-dark sticky-top">
                            <tr>
                                <th style="width: 60px;">ลำดับ</th>
                                <th style="width: 200px;">ชื่อ-นามสกุล</th>
                                <th style="width: 80px;">ห้อง</th>
                                <th style="width: 80px;">สถานะ</th>
                                <th>สาเหตุความสำคัญ</th>
                                <th style="width: 80px;">คะแนน</th>
                                <th style="width: 100px;">รายได้</th>
                                <th style="width: 120px;">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody id="priorityTableBody">
                        </tbody>
                    </table>
                </div>

                <!-- Empty State -->
                <div id="priorityEmptyState" class="text-center py-5" style="display: none;">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</h5>
                    <p class="text-muted">ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือกรอง</p>
                </div>
            </div>
            <div class="modal-footer">
                <div class="d-flex justify-content-between w-100">
                    <div>
                        <small class="text-muted">
                            อัปเดตล่าสุด: <span id="priorityLastUpdate"></span>
                        </small>
                    </div>
                    <div>
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i> ปิด
                        </button>
                        <button type="button" class="btn btn-primary" onclick="refreshPriorityData()">
                            <i class="fas fa-sync-alt"></i> รีเฟรช
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// เพิ่ม Modal ลงใน DOM เมื่อ page โหลด
function initializePriorityModal() {
    // เพิ่ม Modal HTML ลงใน body
    document.body.insertAdjacentHTML('beforeend', priorityModalHTML);
    
    // เพิ่ม CSS
    addPriorityModalCSS();
    
    // Setup event listeners
    setupPriorityModalEventListeners();
}

// Setup Event Listeners สำหรับ Modal
function setupPriorityModalEventListeners() {
    // Wait for elements to be available
    setTimeout(() => {
        // Search input
        const searchInput = document.getElementById('prioritySearch');
        if (searchInput) {
            searchInput.addEventListener('input', filterPriorityCases);
        }
        
        // Filter dropdowns
        const levelFilter = document.getElementById('priorityLevelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', filterPriorityCases);
        }
        
        const classFilter = document.getElementById('priorityClassFilter');
        if (classFilter) {
            classFilter.addEventListener('change', filterPriorityCases);
        }
        
        const visitFilter = document.getElementById('priorityVisitFilter');
        if (visitFilter) {
            visitFilter.addEventListener('change', filterPriorityCases);
        }
        
        // Modal events
        const modal = document.getElementById('priorityCasesModal');
        if (modal) {
            modal.addEventListener('shown.bs.modal', function() {
                // Focus on search input when modal opens
                const searchInput = document.getElementById('prioritySearch');
                if (searchInput) {
                    searchInput.focus();
                }
                
                // Update data when modal opens
                updatePriorityModalData();
            });
        }
    }, 100);
}

// แสดง Modal
function showPriorityCasesModal() {
    const modal = document.getElementById('priorityCasesModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    } else {
        console.error('Priority Cases Modal not found');
    }
}

// อัปเดตข้อมูลใน Modal
function updatePriorityModalData() {
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (typeof homeVisitData === 'undefined' || !homeVisitData || homeVisitData.length === 0) {
        console.warn('No home visit data available');
        return;
    }
    
    const loadingElement = document.getElementById('priorityModalLoading');
    const tableContainer = document.getElementById('priorityTableContainer');
    const emptyState = document.getElementById('priorityEmptyState');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    
    // สร้างข้อมูล Priority Cases
    allPriorityCases = generateAllPriorityCases();
    
    // Populate class filter
    populatePriorityClassFilter();
    
    // Apply filters and display
    filterPriorityCases();
    
    // Update last update time
    const now = new Date();
    const lastUpdateElement = document.getElementById('priorityLastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = now.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        });
    }
    
    setTimeout(() => {
        if (loadingElement) loadingElement.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
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
            
            // ตรวจสอบว่าเลยกำหนดเวลาหรือไม่
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 2 เดือนที่แล้ว
            if (today > startDate) {
                priority += 2;
                reasons.push('เลยกำหนดเวลา');
            }
        }
        
        // รายได้
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0 && income < 3000) {
            priority += 3;
            reasons.push('รายได้ต่ำมาก');
        } else if (income >= 3000 && income < 5000) {
            priority += 2;
            reasons.push('รายได้ต่ำ');
        } else if (income >= 5000 && income < 10000) {
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
            priority += 2;
            reasons.push('มีภาระพึ่งพิง');
        }
        
        // ระยะทางไกล
        if (student.distanceFromSchool && student.distanceFromSchool > 10) {
            priority += 2;
            reasons.push('อยู่ไกลมาก');
        } else if (student.distanceFromSchool && student.distanceFromSchool > 5) {
            priority += 1;
            reasons.push('อยู่ค่อนข้างไกล');
        }
        
        // มีหมายเหตุพิเศษ (ถ้ามีระบบหมายเหตุ)
        if (typeof studentNotes !== 'undefined') {
            const studentId = student['ชื่อและนามสกุล'];
            if (studentNotes[studentId] && studentNotes[studentId].some(note => note.priority === 'urgent')) {
                priority += 2;
                reasons.push('มีหมายเหตุด่วน');
            }
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
    const searchInput = document.getElementById('prioritySearch');
    const levelFilter = document.getElementById('priorityLevelFilter');
    const classFilter = document.getElementById('priorityClassFilter');
    const visitFilter = document.getElementById('priorityVisitFilter');
    
    if (!searchInput || !levelFilter || !classFilter || !visitFilter) {
        console.warn('Filter elements not found');
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const levelFilterValue = levelFilter.value;
    const classFilterValue = classFilter.value;
    const visitFilterValue = visitFilter.value;
    
    filteredPriorityCases = allPriorityCases.filter(student => {
        // ค้นหาชื่อ
        const nameMatch = !searchTerm || 
            (student['ชื่อและนามสกุล'] && student['ชื่อและนามสกุล'].toLowerCase().includes(searchTerm)) ||
            (student['ชื่อเล่น'] && student['ชื่อเล่น'].toLowerCase().includes(searchTerm));
        
        // กรองระดับความสำคัญ
        const levelMatch = !levelFilterValue || student.priorityLevel === levelFilterValue;
        
        // กรองห้องเรียน
        const classMatch = !classFilterValue || student['ห้องเรียน'] === classFilterValue;
        
        // กรองสถานะการเยี่ยม
        const visitMatch = !visitFilterValue || 
            (visitFilterValue === 'visited' && student.isVisited) ||
            (visitFilterValue === 'notVisited' && !student.isVisited);
        
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
        
        // เพิ่มการแสดงหมายเหตุ (ถ้ามีระบบหมายเหตุ)
        let notesPreview = '';
        if (typeof getStudentNotesPreview === 'function') {
            notesPreview = getStudentNotesPreview(student['ชื่อและนามสกุล']);
        }
        
        return `
            <tr class="${rowClass}">
                <td><strong>${index + 1}</strong></td>
                <td>
                    <div><strong>${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</strong></div>
                    <small class="text-muted">${student['ชื่อเล่น'] || ''}</small>
                    ${notesPreview ? '<br>' + notesPreview : ''}
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
                    <div class="btn-group-vertical" role="group">
                        <button class="btn btn-outline-primary btn-sm mb-1" onclick="focusOnStudentMap('${student['ชื่อและนามสกุล']}')" title="ดูบนแผนที่">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm mb-1" onclick="viewStudentDetails('${student['ชื่อและนามสกุล']}')" title="ดูรายละเอียด">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${typeof showNotesModal === 'function' ? 
                            `<button class="btn btn-outline-success btn-sm" onclick="showNotesModal('${student['ชื่อและนามสกุล']}')" title="หมายเหตุ">
                                <i class="fas fa-sticky-note"></i>
                            </button>` : ''
                        }
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
    const elements = ['prioritySearch', 'priorityLevelFilter', 'priorityClassFilter', 'priorityVisitFilter'];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
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

