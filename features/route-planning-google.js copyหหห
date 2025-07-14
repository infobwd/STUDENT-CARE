// features/route-planning-google.js
// ฟีเจอร์วางแผนเส้นทางพร้อม Google Maps Integration

const RoutePlanningGoogle = {
    isInitialized: false,
    optimizedRoute: [],
    tempSelections: [], // เก็บ index ของนักเรียนที่เลือกไว้

    // เริ่มต้นฟีเจอร์
    init() {
        if (this.isInitialized) return;
        console.log('🚗 Initializing Route Planning with Google Maps...');
        
        // รอให้ระบบหลักโหลดเสร็จก่อน
        if (typeof map === 'undefined' || typeof homeVisitData === 'undefined') {
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        this.createRouteButton();
        this.isInitialized = true;
        console.log('✅ Route Planning with Google Maps loaded successfully');
    },
    
    // เพิ่มปุ่มวางแผนเส้นทาง
    createRouteButton() {
    const controlBar = document.querySelector('.btn-group');
    if (!controlBar) return;
    
    // ตรวจสอบว่ามีปุ่มอยู่แล้วหรือไม่
    const existingBtn = document.getElementById('routePlanningGoogleBtn');
    if (existingBtn) {
        existingBtn.remove(); // ลบปุ่มเก่าออก
    }
    
    const routeBtn = document.createElement('button');
    routeBtn.id = 'routePlanningGoogleBtn';
    routeBtn.className = 'btn btn-outline-success btn-sm';
    routeBtn.innerHTML = '<i class="fab fa-google"></i> Google เส้นทาง';
    routeBtn.onclick = () => this.showRoutePlanningModal();
    
    // เพิ่มหลังปุ่ม "กลับจุดเริ่มต้น"
    const centerBtn = document.getElementById('centerMapBtn');
    if (centerBtn) {
        // แทรกหลัง centerBtn
        centerBtn.parentNode.insertBefore(routeBtn, centerBtn.nextSibling);
    } else {
        // ถ้าไม่มี centerBtn ให้เพิ่มที่ท้าย
        controlBar.appendChild(routeBtn);
    }
    
    console.log('✅ Route button created successfully');
},
    
  clearSelection() {
    console.log('🗑️ Clearing all selections...');
    
    // ยกเลิกการเลือกทั้งหมด
    const allCheckboxes = document.querySelectorAll('.google-student-checkbox');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // รีเซ็ต dropdown เป็นค่าเริ่มต้น
    const routeTypeEl = document.getElementById('googleRouteType');
    if (routeTypeEl) {
        routeTypeEl.value = 'custom'; // เปลี่ยนเป็น custom เพื่อไม่ให้เลือกอัตโนมัติ
    }
    
    // อัปเดต summary
    this.updateRouteSummary();
    
    // แสดงข้อความแจ้งเตือน
    this.showToast('ล้างการเลือกทั้งหมดแล้ว', 'info');
    
    console.log('✅ All selections cleared');
},
debugSelections() {
    console.log('🔍 Debug Selections:');
    console.log('- fromPreviewBack:', this.fromPreviewBack);
    console.log('- tempSelections:', this.tempSelections);
    console.log('- checked boxes:', document.querySelectorAll('.google-student-checkbox:checked').length);
    
    const checkedIndices = Array.from(document.querySelectorAll('.google-student-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    console.log('- checked indices:', checkedIndices);
},
    // แสดง Modal วางแผนเส้นทาง
showRoutePlanningModal() {
    console.log('📱 Opening route planning modal');
    console.log('- fromPreviewBack:', this.fromPreviewBack);
    console.log('- tempSelections:', this.tempSelections);
    
    this.removeExistingModal();
    this.createRoutePlanningModal();
    this.populateStudentList(); // จะ restore selections ใน renderStudentList

    const modal = new bootstrap.Modal(document.getElementById('routePlanningGoogleModal'));
    modal.show();
},
    
    // ลบ Modal เดิม (ถ้ามี)
    removeExistingModal() {
        const existingModal = document.getElementById('routePlanningGoogleModal');
        if (existingModal) {
            existingModal.remove();
        }
    },
    
    // สร้าง Modal
   createRoutePlanningModal() {
    const modalHTML = `
        <div class="modal fade" id="routePlanningGoogleModal" tabindex="-1" aria-labelledby="routePlanningGoogleModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="routePlanningGoogleModalLabel">
                            <i class="fab fa-google"></i> วางแผนเส้นทางด้วย Google Maps
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- คำแนะนำ -->
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>คำแนะนำ:</strong> เลือกนักเรียนที่ต้องการเยี่ยม แล้วคลิก "เปิด Google Maps" 
                            ระบบจะสร้างเส้นทางและเปิดใน Google Maps พร้อม turn-by-turn navigation
                        </div>

                        <!-- Real-time Summary Bar -->
                        <div id="googleRouteSummary" class="alert alert-light border" style="display: none;">
                            <div class="row text-center">
                                <div class="col-3">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <i class="fas fa-home text-primary me-2"></i>
                                        <div>
                                            <div class="h4 text-primary mb-0" id="selectedCount">0</div>
                                            <small class="text-muted">ครัวเรือน</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <i class="fas fa-route text-success me-2"></i>
                                        <div>
                                            <div class="h4 text-success mb-0" id="estimatedDistance">0</div>
                                            <small class="text-muted">กิโลเมตร</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <i class="fas fa-clock text-info me-2"></i>
                                        <div>
                                            <div class="h4 text-info mb-0" id="estimatedTime">0</div>
                                            <small class="text-muted">นาที</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <i class="fas fa-car text-warning me-2"></i>
                                        <div>
                                            <div class="h5 text-warning mb-0" id="travelModeDisplay">🚗</div>
                                            <small class="text-muted">การเดินทาง</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="progress mt-2" style="height: 8px;">
                                <div class="progress-bar bg-success" role="progressbar" id="selectionProgress" style="width: 0%"></div>
                            </div>
                            <div class="text-center mt-2">
                                <small class="text-muted" id="summaryStatus">เลือกนักเรียนเพื่อเริ่มวางแผนเส้นทาง</small>
                            </div>
                        </div>

                        <div class="row">
                            <!-- ส่วนควบคุม -->
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="fas fa-cogs"></i> ตั้งค่าการเยี่ยม</h6>
                                    </div>
                                    <div class="card-body">
                                        <!-- เลือกประเภทการเยี่ยม -->
                                        <div class="mb-3">
                                            <label class="form-label">ประเภทการเยี่ยม:</label>
                                            <select id="googleRouteType" class="form-select form-select-sm">
                                                <option value="notVisited">ยังไม่เยี่ยม (แนะนำ)</option>
                                                <option value="priority">ความสำคัญสูง</option>
                                                <option value="nearSchool">ใกล้โรงเรียน</option>
                                                <option value="all">ทุกเคส</option>
                                                <option value="custom">เลือกเอง</option>
                                            </select>
                                        </div>
                                        
                                        <!-- จำนวนการเยี่ยมสูงสุด -->
                                        <div class="mb-3">
                                            <label class="form-label">เยี่ยมสูงสุด:</label>
                                            <select id="googleMaxVisits" class="form-select form-select-sm">
                                                <option value="5">5 ครัวเรือน</option>
                                                <option value="10" selected>10 ครัวเรือน</option>
                                                <option value="15">15 ครัวเรือน</option>
                                                <option value="20">20 ครัวเรือน</option>
                                                <option value="25">25 ครัวเรือน</option>
                                            </select>
                                            <small class="text-muted">Google Maps รองรับสูงสุด 25 จุด</small>
                                        </div>
                                        
                                        <!-- ประเภทการเดินทาง -->
                                        <div class="mb-3">
                                            <label class="form-label">ประเภทการเดินทาง:</label>
                                            <select id="googleTravelMode" class="form-select form-select-sm">
                                                <option value="driving">🚗 ขับรถ</option>
                                                <option value="walking">🚶 เดินเท้า</option>
                                                <option value="bicycling">🚴 จักรยาน</option>
                                                <option value="transit">🚌 ขนส่งสาธารณะ</option>
                                            </select>
                                        </div>
                                        
                                        <!-- เรียงลำดับตาม -->
                                        <div class="mb-3">
                                            <label class="form-label">เรียงลำดับตาม:</label>
                                            <select id="googleSortBy" class="form-select form-select-sm">
                                                <option value="distance">ระยะทางใกล้สุด</option>
                                                <option value="priority">ความสำคัญ</option>
                                                <option value="class">ห้องเรียน</option>
                                                <option value="name">ชื่อ A-Z</option>
                                            </select>
                                        </div>
                                        
                                        <!-- ปุ่มควบคุม -->
                                        <div class="d-grid gap-2">
                                            <button type="button" class="btn btn-primary btn-sm" onclick="RoutePlanningGoogle.generateGoogleRoute()" id="generateRouteBtn" disabled>
                                                <i class="fab fa-google"></i> เปิด Google Maps
                                            </button>
                                            <button type="button" class="btn btn-outline-info btn-sm" onclick="RoutePlanningGoogle.previewRoute()" id="previewRouteBtn" disabled>
                                                <i class="fas fa-eye"></i> ดูตัวอย่างเส้นทาง
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="RoutePlanningGoogle.clearSelection()">
                                                <i class="fas fa-trash"></i> ล้างการเลือก
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Quick Actions -->
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="fas fa-bolt"></i> การกระทำด่วน</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="RoutePlanningGoogle.quickRoute('urgent')">
                                                <i class="fas fa-exclamation-triangle"></i> เคสเร่งด่วน (5 คน)
                                            </button>
                                            <button type="button" class="btn btn-outline-warning btn-sm" onclick="RoutePlanningGoogle.quickRoute('nearby')">
                                                <i class="fas fa-map-marker-alt"></i> ใกล้โรงเรียน (10 คน)
                                            </button>
                                            <button type="button" class="btn btn-outline-success btn-sm" onclick="RoutePlanningGoogle.quickRoute('notVisited')">
                                                <i class="fas fa-list-check"></i> ยังไม่เยี่ยม (15 คน)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- รายการนักเรียน -->
                            <div class="col-md-8">
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0"><i class="fas fa-list"></i> รายการนักเรียน</h6>
                                        <div class="d-flex align-items-center">
                                            <span class="badge bg-primary me-2" id="totalStudentCount">0</span>
                                            <div class="btn-group" role="group">
                                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="RoutePlanningGoogle.selectAll()">
                                                    <i class="fas fa-check-square"></i> เลือกทั้งหมด
                                                </button>
                                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="RoutePlanningGoogle.unselectAll()">
                                                    <i class="fas fa-square"></i> ยกเลิกทั้งหมด
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- เพิ่มส่วนค้นหา -->
                                    <div class="card-body pb-2">
                                        <div class="input-group input-group-sm mb-3">
                                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                                            <input type="text" id="googleStudentSearch" class="form-control" placeholder="ค้นหาชื่อ-นามสกุล, ชื่อเล่น, หรือห้องเรียน...">
                                            <button class="btn btn-outline-secondary" type="button" onclick="RoutePlanningGoogle.clearSearch()">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body pt-0" style="max-height: 500px; overflow-y: auto;">
                                        <div id="googleStudentListContainer">
                                            <div class="text-center">
                                                <div class="spinner-border spinner-border-sm" role="status"></div>
                                                <small class="ms-2">กำลังโหลดรายการ...</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="d-flex justify-content-between w-100">
                            <div>
                                <small class="text-muted">
                                    <i class="fas fa-info-circle"></i> 
                                    Google Maps จะเปิดในแท็บใหม่พร้อมเส้นทางที่เหมาะสม
                                </small>
                            </div>
                            <div>
                                <button type="button" class="btn btn-outline-info" onclick="RoutePlanningGoogle.shareRoute()" id="shareRouteBtn" disabled>
                                    <i class="fas fa-share"></i> แชร์เส้นทาง
                                </button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times"></i> ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ตั้งค่า event listeners พร้อม real-time updates
    this.setupModalEventListeners();
},
    
  // ตั้งค่า Event Listeners สำหรับ Real-time Updates
setupModalEventListeners() {
    // Route Type Change
    const routeTypeEl = document.getElementById('googleRouteType');
    if (routeTypeEl) {
        routeTypeEl.addEventListener('change', () => {
            this.onRouteTypeChanged();
            this.updateRouteSummary();
        });
    }
    
    // Max Visits Change
    const maxVisitsEl = document.getElementById('googleMaxVisits');
    if (maxVisitsEl) {
        maxVisitsEl.addEventListener('change', () => {
            this.updateRouteSummary();
            this.validateSelection();
        });
    }
    
    // Travel Mode Change
    const travelModeEl = document.getElementById('googleTravelMode');
    if (travelModeEl) {
        travelModeEl.addEventListener('change', () => {
            this.updateTravelModeDisplay();
            this.updateRouteSummary();
        });
    }
    
    // Sort By Change
    const sortByEl = document.getElementById('googleSortBy');
    if (sortByEl) {
        sortByEl.addEventListener('change', () => {
            this.sortStudentList();
        });
    }
    
    // Search Input
    const searchEl = document.getElementById('googleStudentSearch');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });
        
        // Clear search on escape
        searchEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }
    
    // Show summary on modal open
    const modal = document.getElementById('routePlanningGoogleModal');
    if (modal) {
        modal.addEventListener('shown.bs.modal', () => {
            document.getElementById('googleRouteSummary').style.display = 'block';
            this.updateRouteSummary();
        });
    }
},

  
  // อัปเดตการแสดงผลโหมดการเดินทาง
updateTravelModeDisplay() {
    const travelModeEl = document.getElementById('googleTravelMode');
    const displayEl = document.getElementById('travelModeDisplay');
    
    if (!travelModeEl || !displayEl) return;
    
    const modes = {
        'driving': '🚗',
        'walking': '🚶',
        'bicycling': '🚴',
        'transit': '🚌'
    };
    
    displayEl.textContent = modes[travelModeEl.value] || '🚗';
},
  
// ตรวจสอบและเปิด/ปิดปุ่ม
validateSelection() {
    const selectedCount = this.getSelectedStudentsCount();
    const maxVisits = parseInt(document.getElementById('googleMaxVisits')?.value) || 25;
    
    // Enable/Disable buttons based on selection
    const generateBtn = document.getElementById('generateRouteBtn');
    const previewBtn = document.getElementById('previewRouteBtn');
    const shareBtn = document.getElementById('shareRouteBtn');
    
    const isValidSelection = selectedCount > 0 && selectedCount <= maxVisits;
    
    if (generateBtn) generateBtn.disabled = !isValidSelection;
    if (previewBtn) previewBtn.disabled = !isValidSelection;
    if (shareBtn) shareBtn.disabled = !isValidSelection;
    
    return isValidSelection;
},  
  
// นับจำนวนนักเรียนที่เลือก
getSelectedStudentsCount() {
    const visibleCheckedBoxes = Array.from(document.querySelectorAll('.google-student-checkbox:checked')).filter(checkbox => {
        const parentItem = checkbox.closest('.google-student-item');
        return parentItem && 
               parentItem.style.display !== 'none' && 
               parentItem.offsetParent !== null;
    });
    return visibleCheckedBoxes.length;
},  
  
  
restoreSelectionsWhenReady(expectedIndices = []) {
    const container = document.getElementById('googleStudentListContainer');
    if (!container || this.isRestoring) return;

    this.isRestoring = true; // ป้องกันเรียกซ้ำ

    const observer = new MutationObserver((mutations, obs) => {
        const allReady = expectedIndices.every(index => {
            return document.getElementById(`google_student_${index}`);
        });

        if (allReady) {
            obs.disconnect();
            expectedIndices.forEach(index => {
                const checkbox = document.getElementById(`google_student_${index}`);
                if (checkbox) checkbox.checked = true;
            });

            this.updateRouteSummary();

            // ✅ Reset flag
            this.isRestoring = false;
        }
    });

    observer.observe(container, {
        childList: true,
        subtree: true
    });
}

, 

    // โหลดรายการนักเรียน
populateStudentList() {
    const container = document.getElementById('googleStudentListContainer');
    const totalCountEl = document.getElementById('totalStudentCount');

    if (!container) return;

    if (!homeVisitData || homeVisitData.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">ไม่พบข้อมูลนักเรียน</div>';
        if (totalCountEl) totalCountEl.textContent = '0';
        return;
    }

    // กรองเฉพาะนักเรียนที่มีพิกัด
    const studentsWithCoords = homeVisitData
        .map((student, index) => ({ ...student, originalIndex: index }))
        .filter(student => student['LatLongHome']?.includes(','));

    if (studentsWithCoords.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">ไม่พบนักเรียนที่มีพิกัดที่อยู่</div>';
        if (totalCountEl) totalCountEl.textContent = '0';
        return;
    }

    // อัปเดตจำนวนทั้งหมด
    if (totalCountEl) {
        totalCountEl.textContent = studentsWithCoords.length;
    }

    // แสดงรายการ
    this.renderStudentList(studentsWithCoords);
},
    
    // ฟังก์ชันค้นหานักเรียน
     searchStudents(searchTerm) {
        const items = document.querySelectorAll('.google-student-item');
        const term = searchTerm.toLowerCase().trim();
        
        let visibleCount = 0;
        
        items.forEach(item => {
            const index = parseInt(item.dataset.index);
            if (isNaN(index) || !homeVisitData[index]) {
                item.style.display = 'none';
                return;
            }
            
            const student = homeVisitData[index];
            const name = (student['ชื่อและนามสกุล'] || '').toLowerCase();
            const nickname = (student['ชื่อเล่น'] || '').toLowerCase();
            const classroom = (student['ห้องเรียน'] || '').toLowerCase();
            
            // ค้นหาในชื่อ, ชื่อเล่น, หรือห้องเรียน
            const isMatch = term === '' || 
                           name.includes(term) || 
                           nickname.includes(term) || 
                           classroom.includes(term);
            
            item.style.display = isMatch ? 'block' : 'none';
            if (isMatch) visibleCount++;
        });
        
        console.log(`🔍 Search results: ${visibleCount} items visible for term: "${term}"`);
        
        // อัปเดตสรุปหลังค้นหา
        setTimeout(() => this.updateRouteSummary(), 100);
    },
    
    // ล้างการค้นหา
    clearSearch() {
        const searchInput = document.getElementById('googleStudentSearch');
        if (searchInput) {
            searchInput.value = '';
            this.searchStudents(''); // แสดงทั้งหมด
        }
    },
    
    // แสดงรายการนักเรียน
 renderStudentList(students) {
    const container = document.getElementById('googleStudentListContainer');
    
    // ✅ ปิดการอัปเดต summary ชั่วคราวขณะ render
    this.isRendering = true;
    
    const studentListHTML = students.map((student) => {
        const originalIndex = student.originalIndex;
        const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
        const distance = student.distanceFromSchool ? 
            `${student.distanceFromSchool.toFixed(1)} กม.` : 'ไม่ทราบ';
        
        const statusBadge = isVisited ? 
            '<span class="badge bg-success">เยี่ยมแล้ว</span>' : 
            '<span class="badge bg-danger">ยังไม่เยี่ยม</span>';
        
        const priorityScore = this.calculatePriorityScore(student);
        const priorityBadge = priorityScore >= 6 ? 
            '<span class="badge bg-warning">สำคัญ</span>' : '';
        
        // ✅ ตรวจสอบว่าต้อง restore selection หรือไม่
        const shouldBeChecked = this.shouldStudentBeChecked(originalIndex, isVisited);
        
        return `
            <div class="form-check border rounded p-2 mb-2 google-student-item" data-index="${originalIndex}" data-priority="${priorityScore}">
                <input class="form-check-input google-student-checkbox" type="checkbox" value="${originalIndex}" id="google_student_${originalIndex}" ${shouldBeChecked ? 'checked' : ''}>
                
                <label class="form-check-label w-100" for="google_student_${originalIndex}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</strong>
                            <small class="text-muted d-block">${student['ห้องเรียน'] || ''} • ${distance}</small>
                        </div>
                        <div class="text-end">
                            ${statusBadge}
                            ${priorityBadge}
                        </div>
                    </div>
                </label>
            </div>
        `;
    }).join('');
    
    container.innerHTML = studentListHTML;
    
    // ✅ Bind events ทันที
    this.bindCheckboxEvents();
    
    // ✅ เปิดการอัปเดต summary กลับคืน
    this.isRendering = false;
    
    // ✅ อัปเดตครั้งเดียวหลัง render เสร็จ
    setTimeout(() => {
        this.sortStudentList();
        this.updateRouteSummary();
        
        // ✅ ล้าง restore flags หลังจากเสร็จสิ้น
        if (this.fromPreviewBack) {
            console.log(`✅ Successfully restored ${this.tempSelections?.length || 0} selections after preview`);
            this.fromPreviewBack = false;
            this.tempSelections = null; // ล้างเพื่อป้องกันปัญหา
        }
    }, 150);
},
  
  // ✅ ฟังก์ชันใหม่: ตรวจสอบว่านักเรียนคนนี้ควรถูกเลือกหรือไม่
shouldStudentBeChecked(originalIndex, isVisited) {
    // ถ้ากลับมาจาก preview และมี tempSelections
    if (this.fromPreviewBack && this.tempSelections && this.tempSelections.length > 0) {
        return this.tempSelections.includes(originalIndex);
    }
    
    // ถ้าไม่ใช่การ restore ให้ใช้ logic เดิม (เลือกที่ยังไม่เยี่ยม)
    return !isVisited;
},
  
  
  // ฟังก์ชันแยกสำหรับ bind events
    bindCheckboxEvents() {
        // ลบ event listeners เก่า (ถ้ามี)
        document.querySelectorAll('.google-student-checkbox').forEach(checkbox => {
            checkbox.removeEventListener('change', this.handleCheckboxChange);
        });
        
        // เพิ่ม event listeners ใหม่
        document.querySelectorAll('.google-student-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
        });
    },
  
   // Handle checkbox change event
handleCheckboxChange(event) {
    if (this.isRendering) return; // ข้ามถ้ากำลัง render
    
    // Debounce เพื่อรวมการอัปเดตหลายครั้งเป็นครั้งเดียว
    clearTimeout(this.summaryUpdateTimeout);
    this.summaryUpdateTimeout = setTimeout(() => {
        this.updateRouteSummary();
    }, 50);
},

    // คำนวณคะแนนความสำคัญ
    calculatePriorityScore(student) {
        let priority = 0;
        
        // ยังไม่เยี่ยม
        if (student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว') priority += 3;
        
        // รายได้ต่ำ
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0 && income < 5000) priority += 3;
        else if (income >= 5000 && income < 10000) priority += 2;
        else if (income >= 10000 && income < 15000) priority += 1;
        
        // ได้สวัสดิการ
        if (student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE') priority += 1;
        
        // มีภาระพึ่งพิง
        if (student['ครัวเรือนมีภาระพึ่งพิง']) priority += 1;
        
        // ไกลจากโรงเรียน
        if (student.distanceFromSchool && student.distanceFromSchool > 5) priority += 2;
        else if (student.distanceFromSchool && student.distanceFromSchool > 3) priority += 1;
        
        return priority;
    },
    
    // เมื่อเปลี่ยนประเภทการเยี่ยม
 onRouteTypeChanged() {
    const routeTypeEl = document.getElementById('googleRouteType');
    if (!routeTypeEl) return;

    const routeType = routeTypeEl.value;
    console.log('🔄 Route type changed to:', routeType);

    // ✅ ถ้ากำลัง restore จาก preview ให้ข้าม auto-select
    if (this.fromPreviewBack && this.tempSelections && this.tempSelections.length > 0) {
        console.log('⏳ ข้าม auto-select เพราะกำลัง restore จาก preview');
        return;
    }

    const checkboxes = document.querySelectorAll('.google-student-checkbox');

    checkboxes.forEach((checkbox, index) => {
        const studentIndex = parseInt(checkbox.value);
        if (isNaN(studentIndex) || !homeVisitData[studentIndex]) return;

        const student = homeVisitData[studentIndex];
        let shouldCheck = false;

        switch (routeType) {
            case 'all':
                shouldCheck = true;
                break;
            case 'notVisited':
                shouldCheck = student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว';
                break;
            case 'priority':
                shouldCheck = this.calculatePriorityScore(student) >= 4;
                break;
            case 'nearSchool':
                shouldCheck = student.distanceFromSchool && student.distanceFromSchool < 3;
                break;
            case 'custom':
                return; // ไม่เปลี่ยนอะไร
        }

        checkbox.checked = shouldCheck;
    });

    // อัปเดตสรุปหลังเปลี่ยนประเภท
    setTimeout(() => this.updateRouteSummary(), 100);
},
    
    // เรียงลำดับรายการนักเรียน
    sortStudentList() {
        const sortByEl = document.getElementById('googleSortBy');
        const container = document.getElementById('googleStudentListContainer');
        
        if (!sortByEl || !container) return;
        
        const sortBy = sortByEl.value;
        const items = Array.from(container.querySelectorAll('.google-student-item'));
        
        items.sort((a, b) => {
            const indexA = parseInt(a.dataset.index);
            const indexB = parseInt(b.dataset.index);
            
            if (isNaN(indexA) || isNaN(indexB) || !homeVisitData[indexA] || !homeVisitData[indexB]) {
                return 0;
            }
            
            const studentA = homeVisitData[indexA];
            const studentB = homeVisitData[indexB];
            
            switch (sortBy) {
                case 'distance':
                    return (studentA.distanceFromSchool || 999) - (studentB.distanceFromSchool || 999);
                case 'priority':
                    return parseInt(b.dataset.priority || 0) - parseInt(a.dataset.priority || 0);
                case 'class':
                    return (studentA['ห้องเรียน'] || '').localeCompare(studentB['ห้องเรียน'] || '');
                case 'name':
                    return (studentA['ชื่อและนามสกุล'] || '').localeCompare(studentB['ชื่อและนามสกุล'] || '');
                default:
                    return 0;
            }
        });
        
        // เรียงใหม่ใน DOM
        items.forEach(item => container.appendChild(item));
    },
    
// อัปเดตสรุปเส้นทาง - Enhanced Version
updateRouteSummary() {
    const selectedCountEl = document.getElementById('selectedCount');
    const estimatedDistanceEl = document.getElementById('estimatedDistance');
    const estimatedTimeEl = document.getElementById('estimatedTime');
    const summaryDiv = document.getElementById('googleRouteSummary');
    const progressBar = document.getElementById('selectionProgress');
    const statusEl = document.getElementById('summaryStatus');
    const maxVisitsEl = document.getElementById('googleMaxVisits');
     const checked = document.querySelectorAll('.google-student-checkbox:checked');
    console.log(`🔁 Summary: ${checked.length} students selected`);
    // ตรวจสอบว่า modal เปิดอยู่
    const modal = document.getElementById('routePlanningGoogleModal');
    if (!modal || !modal.classList.contains('show')) return;
    
    if (!selectedCountEl || !estimatedDistanceEl || !estimatedTimeEl || !summaryDiv) return;
    
    try {
        const selectedCount = this.getSelectedStudentsCount();
        const maxVisits = parseInt(maxVisitsEl?.value) || 25;
        
        // คำนวณระยะทางและเวลา
        let totalDistance = 0;
        let validStudents = 0;
        
        if (selectedCount > 0) {
            const checkedBoxes = Array.from(document.querySelectorAll('.google-student-checkbox:checked')).filter(checkbox => {
                const parentItem = checkbox.closest('.google-student-item');
                return parentItem && 
                       parentItem.style.display !== 'none' && 
                       parentItem.offsetParent !== null;
            });
            
            checkedBoxes.forEach(checkbox => {
                const index = parseInt(checkbox.value);
                if (!isNaN(index) && homeVisitData && homeVisitData[index]) {
                    const student = homeVisitData[index];
                    totalDistance += parseFloat(student.distanceFromSchool) || 0;
                    validStudents++;
                }
            });
        }
        
        const estimatedTime = (validStudents * 30) + (totalDistance * 3);
        const progressPercent = Math.min((selectedCount / maxVisits) * 100, 100);
        
        // อัปเดต UI
        selectedCountEl.textContent = selectedCount.toString();
        estimatedDistanceEl.textContent = totalDistance.toFixed(1);
        estimatedTimeEl.textContent = Math.round(estimatedTime).toString();
        
        // อัปเดต progress bar
        if (progressBar) {
            progressBar.style.width = progressPercent + '%';
            
            // เปลี่ยนสีตามสถานะ
            progressBar.className = 'progress-bar';
            if (selectedCount > maxVisits) {
                progressBar.classList.add('bg-danger');
            } else if (selectedCount > maxVisits * 0.8) {
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.add('bg-success');
            }
        }
        
        // อัปเดตสถานะ
        if (statusEl) {
            if (selectedCount === 0) {
                statusEl.textContent = 'เลือกนักเรียนเพื่อเริ่มวางแผนเส้นทาง';
                statusEl.className = 'text-muted';
            } else if (selectedCount > maxVisits) {
                statusEl.textContent = `เลือกเกินขีดจำกัด! (${selectedCount}/${maxVisits})`;
                statusEl.className = 'text-danger';
            } else {
                statusEl.textContent = `พร้อมสร้างเส้นทาง (${selectedCount}/${maxVisits})`;
                statusEl.className = 'text-success';
            }
        }
        
        // อัปเดตสี summary
        if (selectedCount > maxVisits) {
            summaryDiv.className = 'alert alert-warning border';
        } else if (selectedCount > 0) {
            summaryDiv.className = 'alert alert-light border border-success';
        } else {
            summaryDiv.className = 'alert alert-light border';
        }
        
        // เปิด/ปิดปุ่ม
        this.validateSelection();
        
        // อัปเดต travel mode display
        this.updateTravelModeDisplay();
        
        console.log(`✅ Summary updated: ${selectedCount} students, ${totalDistance.toFixed(1)}km, ${Math.round(estimatedTime)}min`);
        
    } catch (error) {
        console.error('❌ Error updating route summary:', error);
    }
},
    
    // เลือกทั้งหมด
selectAll() {
        const maxVisitsEl = document.getElementById('googleMaxVisits');
        if (!maxVisitsEl) return;
        
        const maxVisits = parseInt(maxVisitsEl.value) || 25;
        const visibleCheckboxes = Array.from(document.querySelectorAll('.google-student-checkbox')).filter(checkbox => {
            const parentItem = checkbox.closest('.google-student-item');
            return parentItem && 
                   parentItem.style.display !== 'none' && 
                   parentItem.offsetParent !== null;
        });
        
        let count = 0;
        visibleCheckboxes.forEach(checkbox => {
            if (count < maxVisits) {
                checkbox.checked = true;
                count++;
            } else {
                checkbox.checked = false;
            }
        });
        
        console.log(`✅ Selected ${count} students out of ${maxVisits} max`);
        
        // อัปเดตสรุป
        setTimeout(() => this.updateRouteSummary(), 100);
    },
    
    // ยกเลิกทั้งหมด
unselectAll() {
        const visibleCheckboxes = Array.from(document.querySelectorAll('.google-student-checkbox')).filter(checkbox => {
            const parentItem = checkbox.closest('.google-student-item');
            return parentItem && 
                   parentItem.style.display !== 'none' && 
                   parentItem.offsetParent !== null;
        });
        
        visibleCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        console.log('🗑️ Unselected all visible students');
        
        // อัปเดตสรุป
        setTimeout(() => this.updateRouteSummary(), 100);
    },
    
    // การกระทำด่วน
    quickRoute(type) {
        // ยกเลิกทั้งหมดก่อน
        this.unselectAll();
        
        // เลือกเฉพาะ checkbox ที่แสดงผลอยู่
        const visibleCheckboxes = Array.from(document.querySelectorAll('.google-student-checkbox')).filter(checkbox => {
            const parentItem = checkbox.closest('.google-student-item');
            return parentItem && parentItem.style.display !== 'none';
        });
        
        let limits = { urgent: 5, nearby: 10, notVisited: 15 };
        let count = 0;
        
        visibleCheckboxes.forEach(checkbox => {
            if (count >= limits[type]) return;
            
            const studentIndex = parseInt(checkbox.value);
            if (isNaN(studentIndex) || !homeVisitData[studentIndex]) return;
            
            const student = homeVisitData[studentIndex];
            let shouldSelect = false;
            
            switch (type) {
                case 'urgent':
                    shouldSelect = this.calculatePriorityScore(student) >= 6;
                    break;
                case 'nearby':
                    shouldSelect = student.distanceFromSchool && student.distanceFromSchool < 3;
                    break;
                case 'notVisited':
                    shouldSelect = student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว';
                    break;
            }
            
            if (shouldSelect) {
                checkbox.checked = true;
                count++;
            }
        });
        
        this.updateRouteSummary();
        
        // แจ้งเตือน
        const messages = {
            urgent: `เลือกเคสเร่งด่วน ${count} คนแล้ว`,
            nearby: `เลือกนักเรียนใกล้โรงเรียน ${count} คนแล้ว`,
            notVisited: `เลือกนักเรียนที่ยังไม่เยี่ยม ${count} คนแล้ว`
        };
        
        this.showToast(messages[type], 'success');
    },
 ///////////////////////////////////////   
// Enhanced previewRoute - Simple & Clean Design สำหรับคุณครู
previewRoute() {
    const selectedCheckboxes = document.querySelectorAll('.google-student-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        Swal.fire({ icon: 'warning', title: 'ยังไม่ได้เลือกนักเรียน' });
        return;
    }

    // ✅ เก็บ original indices ของนักเรียนที่เลือก
    const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    console.log('💾 Saving selections for restore:', selectedIndices);
    
    // ✅ เก็บไว้ใน tempSelections
    this.tempSelections = selectedIndices;
    this.fromPreviewBack = false; // ยังไม่ได้กลับมา

    // สร้าง array ของ student objects สำหรับ preview
    const selectedStudents = selectedIndices.map(index => ({
        ...homeVisitData[index],
        originalIndex: index
    }));

    this.closeCurrentModalAndShowPreview(selectedStudents);
},
  
// ฟังก์ชันใหม่สำหรับปิด modal เดิมและแสดง preview
closeCurrentModalAndShowPreview(selectedStudents) {
    const currentModal = bootstrap.Modal.getInstance(document.getElementById('routePlanningGoogleModal'));

    // ✅ เก็บ index ของนักเรียนที่เลือกไว้ (ใช้ originalIndex)
    this.tempSelections = selectedStudents.map(s => s.originalIndex);

    if (currentModal) {
        currentModal.hide();

        const modalElement = document.getElementById('routePlanningGoogleModal');
        modalElement.addEventListener('hidden.bs.modal', () => {
            setTimeout(() => {
                this.showRoutePreviewModal(selectedStudents);
            }, 200);
        }, { once: true });
    } else {
        this.showRoutePreviewModal(selectedStudents);
    }
}
,

// ฟังก์ชันใหม่สำหรับสร้างและแสดง Route Preview Modal
showRoutePreviewModal(selectedStudents) {
    console.log('📋 Creating route preview modal');
    
    // ลบ modal preview เก่า (ถ้ามี)
    this.removeExistingPreviewModal();
    
    // คำนวณข้อมูลเส้นทาง
    const routeData = this.calculateRouteData(selectedStudents);
    
    // สร้าง preview modal
    this.createRoutePreviewModal(selectedStudents, routeData);
    
    // แสดง modal
    const previewModal = new bootstrap.Modal(document.getElementById('routePreviewModal'));
    previewModal.show();
    
    console.log('✅ Route preview modal displayed');
},

// ลบ Preview Modal เดิม (ถ้ามี)
removeExistingPreviewModal() {
    const existingModal = document.getElementById('routePreviewModal');
    if (existingModal) {
        // ปิด modal ถ้าเปิดอยู่
        const modalInstance = bootstrap.Modal.getInstance(existingModal);
        if (modalInstance) {
            modalInstance.hide();
        }
        existingModal.remove();
    }
},

// คำนวณข้อมูลเส้นทาง
calculateRouteData(students) {
    const travelMode = document.getElementById('googleTravelMode')?.value || 'driving';
    const sortBy = document.getElementById('googleSortBy')?.value || 'distance';
    
    // เรียงลำดับนักเรียนตามการตั้งค่า
    const sortedStudents = this.sortSelectedStudents(students);
    
    // คำนวณระยะทางรวม
    const totalDistance = sortedStudents.reduce((sum, student) => {
        return sum + (student.distanceFromSchool || 0);
    }, 0);
    
    // คำนวณเวลา
    const estimatedTime = this.calculateAccurateTime(sortedStudents, travelMode);
    
    // สร้าง Google Maps URL
    const googleMapsUrl = this.generateGoogleMapsUrl(sortedStudents);
    
    return {
        students: sortedStudents,
        totalDistance: totalDistance,
        estimatedTime: estimatedTime,
        travelMode: travelMode,
        googleMapsUrl: googleMapsUrl,
        startTime: new Date()
    };
},

// คำนวณเวลาที่แม่นยำขึ้น
calculateAccurateTime(students, travelMode) {
    const baseVisitTime = 30; // นาที/ครัวเรือน
    const setupTime = 5; // เวลาเตรียมตัวระหว่างบ้าน
    
    const speedMap = {
        driving: 35,    // กม./ชม. (ในเมือง + ต่างจังหวัด)
        walking: 4,     // กม./ชม.
        bicycling: 15,  // กม./ชม.
        transit: 25     // กม./ชม.
    };
    
    let totalMinutes = 0;
    
    // เวลาเดินทางจากโรงเรียนไปบ้านแรก
    if (students.length > 0) {
        const firstStudent = students[0];
        const distanceToFirst = firstStudent.distanceFromSchool || 0;
        totalMinutes += (distanceToFirst / speedMap[travelMode]) * 60;
    }
    
    // เวลาเยี่ยมและเดินทางระหว่างบ้าน
    students.forEach((student, index) => {
        totalMinutes += baseVisitTime; // เวลาเยี่ยม
        
        if (index < students.length - 1) {
            // เวลาเดินทางไปบ้านต่อไป
            const nextStudent = students[index + 1];
            const distance = this.calculateDistanceBetweenStudents(student, nextStudent);
            totalMinutes += (distance / speedMap[travelMode]) * 60 + setupTime;
        }
    });
    
    // เวลากลับโรงเรียน
    if (students.length > 0) {
        const lastStudent = students[students.length - 1];
        const distanceBack = lastStudent.distanceFromSchool || 0;
        totalMinutes += (distanceBack / speedMap[travelMode]) * 60;
    }
    
    return {
        hours: Math.floor(totalMinutes / 60),
        minutes: Math.round(totalMinutes % 60),
        totalMinutes: Math.round(totalMinutes)
    };
},

// คำนวณระยะทางระหว่างนักเรียน
calculateDistanceBetweenStudents(student1, student2) {
    if (!student1['LatLongHome'] || !student2['LatLongHome']) return 0;
    
    const [lat1, lng1] = student1['LatLongHome'].split(',').map(coord => parseFloat(coord.trim()));
    const [lat2, lng2] = student2['LatLongHome'].split(',').map(coord => parseFloat(coord.trim()));
    
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return 0;
    
    const R = 6371; // รัศมีโลกในกิโลเมตร
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
},

// สร้าง Route Preview Modal
// ฟังก์ชันสร้างและแสดง Route Preview Modal แบบสวยงามและทันสมัย
// สร้าง Route Preview Modal - ปรับปรุงใหม่พร้อมแผนที่ Interactive
createRoutePreviewModal(students, routeData) {
    const modalHTML = `
        <div class="modal fade" id="routePreviewModal" tabindex="-1" aria-labelledby="routePreviewModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable modal-xl">
                <div class="modal-content rounded-4 border-0 shadow">
                    <div class="modal-header bg-white border-bottom-0">
                        <h5 class="modal-title fw-semibold text-dark" id="routePreviewModalLabel">
                            🗺️ ตัวอย่างเส้นทางเยี่ยมบ้าน
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body bg-light">
                        <!-- สรุปข้อมูลเส้นทาง -->
                        <section class="mb-4">
                            <div class="row text-center g-3">
                                ${this.renderStatCard('👨‍👩‍👧‍👦', 'ครัวเรือน', students.length)}
                                ${this.renderStatCard('📏', 'ระยะทางรวม', `${routeData.totalDistance.toFixed(1)} กม.`)}
                                ${this.renderStatCard('⏱️', 'เวลาประมาณ', `${routeData.estimatedTime.hours} ชม. ${routeData.estimatedTime.minutes} นาที`)}
                                ${this.renderStatCard('🚙', 'การเดินทาง', this.getTravelModeText())}
                            </div>
                        </section>

                        <!-- แผนที่เส้นทาง - ส่วนใหม่ -->
                        <section class="mb-4">
                            <h6 class="fw-bold mb-2">🗺️ แผนที่เส้นทาง</h6>
                            <div class="bg-white p-3 rounded shadow-sm">
                                <!-- คำอธิบายและปุ่มควบคุม -->
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div class="d-flex align-items-center">
                                        <small class="text-muted me-3">
                                            <span class="badge bg-danger me-1">🏫</span> โรงเรียน
                                            <span class="badge bg-primary me-1">📍</span> ยังไม่เยี่ยม  
                                            <span class="badge bg-success me-1">✅</span> เยี่ยมแล้ว
                                        </small>
                                    </div>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="RoutePlanningGoogle.centerMap()" title="กลับจุดกลาง">
                                            <i class="fas fa-compress-arrows-alt"></i> จุดกลาง
                                        </button>
                                        <button class="btn btn-outline-info" onclick="RoutePlanningGoogle.toggleMapView()" title="เต็มจอ">
                                            <i class="fas fa-expand"></i> เต็มจอ
                                        </button>
                                        <button class="btn btn-outline-success" onclick="RoutePlanningGoogle.openGoogleMapsFromPreview()" title="เปิด Google Maps">
                                            <i class="fab fa-google"></i> Google Maps
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- แผนที่ Interactive -->
                                ${this.generateInteractiveMapHTML()}
                            </div>
                            <p class="text-muted text-center mt-2 small">
                                <i class="fas fa-mouse-pointer"></i> 
                                คลิกที่หมุดเพื่อดูรายละเอียด • ลากเพื่อเลื่อนแผนที่ • ล้อเมาส์เพื่อซูม
                            </p>
                        </section>

                        <!-- รายละเอียดเส้นทาง -->
                        <section class="row g-4">
                            <div class="col-md-6">
                                <h6 class="mb-2 fw-bold">🔄 ลำดับการเยี่ยม</h6>
                                <div class="bg-white p-3 rounded shadow-sm" style="max-height: 400px; overflow-y: auto;">
                                    ${this.generateRouteTimelineHTML(students, routeData)}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="mb-2 fw-bold">👩‍🏫 รายละเอียดนักเรียน</h6>
                                <div class="bg-white p-3 rounded shadow-sm" style="max-height: 400px; overflow-y: auto;">
                                    ${this.generateStudentDetailsHTML(students)}
                                </div>
                            </div>
                        </section>

                        <!-- ข้อมูลเพิ่มเติม -->
                        <section class="mt-4">
                            <div class="row g-3">
                                <!-- สถิติการเยี่ยม -->
                                <div class="col-md-6">
                                    <div class="bg-white p-3 rounded shadow-sm">
                                        <h6 class="fw-bold mb-2">📊 สถิติการเยี่ยม</h6>
                                        ${this.generateVisitStats(students)}
                                    </div>
                                </div>
                                <!-- เส้นทางโดยสังเขป -->
                                <div class="col-md-6">
                                    <div class="bg-white p-3 rounded shadow-sm">
                                        <h6 class="fw-bold mb-2">🚗 ข้อมูลเส้นทาง</h6>
                                        ${this.generateRouteInfo(routeData)}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div class="modal-footer bg-white border-top-0">
                        <div class="d-flex justify-content-between w-100">
                            <button class="btn btn-outline-dark" onclick="RoutePlanningGoogle.backToRoutePlanning()">
                                <i class="fas fa-arrow-left"></i> กลับไปแก้ไข
                            </button>
                            <div>
                                <button class="btn btn-success me-2" onclick="RoutePlanningGoogle.generateGoogleRouteFromPreview()">
                                    <i class="fab fa-google"></i> เปิด Google Maps
                                </button>
                                <button class="btn btn-info me-2" onclick="RoutePlanningGoogle.printRoutePreview()">
                                    <i class="fas fa-print"></i> พิมพ์
                                </button>
                                <button class="btn btn-outline-secondary me-2" onclick="RoutePlanningGoogle.shareRoutePreview()">
                                    <i class="fas fa-share"></i> แชร์
                                </button>
                                <button class="btn btn-light border" data-bs-dismiss="modal">
                                    <i class="fas fa-times"></i> ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.currentPreviewData = { students, routeData };
    
    // ตั้งค่า Event Listeners
    this.setupPreviewModalEvents();
},

// ฟังก์ชันสร้างสถิติการเยี่ยม
generateVisitStats(students) {
    const visited = students.filter(s => s['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว').length;
    const notVisited = students.length - visited;
    const avgDistance = students.reduce((sum, s) => sum + (s.distanceFromSchool || 0), 0) / students.length;
    const priorityHigh = students.filter(s => this.calculatePriorityScore(s) >= 6).length;
    
    return `
        <div class="row text-center">
            <div class="col-6 border-end">
                <div class="h4 text-success mb-0">${visited}</div>
                <small class="text-muted">เยี่ยมแล้ว</small>
            </div>
            <div class="col-6">
                <div class="h4 text-danger mb-0">${notVisited}</div>
                <small class="text-muted">ยังไม่เยี่ยม</small>
            </div>
        </div>
        <hr class="my-2">
        <div class="row text-center">
            <div class="col-6 border-end">
                <div class="h5 text-info mb-0">${avgDistance.toFixed(1)}</div>
                <small class="text-muted">กม.เฉลี่ย</small>
            </div>
            <div class="col-6">
                <div class="h5 text-warning mb-0">${priorityHigh}</div>
                <small class="text-muted">ความสำคัญสูง</small>
            </div>
        </div>
    `;
},

// ฟังก์ชันสร้างข้อมูลเส้นทาง
generateRouteInfo(routeData) {
    const startTime = new Date();
    startTime.setHours(15, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + routeData.estimatedTime.totalMinutes * 60000);
    
    return `
        <div class="mb-2">
            <small class="text-muted">เวลาเริ่มต้น (แนะนำ):</small>
            <div class="fw-bold">${startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
        </div>
        <div class="mb-2">
            <small class="text-muted">เวลาสิ้นสุด (ประมาณ):</small>
            <div class="fw-bold">${endTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</div>
        </div>
        <div class="mb-2">
            <small class="text-muted">ประเภทการเดินทาง:</small>
            <div class="fw-bold">${this.getTravelModeText()}</div>
        </div>
        <div>
            <small class="text-muted">การเรียงลำดับ:</small>
            <div class="fw-bold">${this.getSortByText()}</div>
        </div>
    `;
},

// ตั้งค่า Event Listeners สำหรับ Preview Modal
setupPreviewModalEvents() {
    // ฟัง ESC key เพื่อปิด full-screen map
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const mapContainer = document.getElementById('interactiveMapContainer');
            if (mapContainer && mapContainer.style.position === 'fixed') {
                this.toggleMapView();
            }
        }
    });
    
    // ฟังเมื่อ modal เปิดขึ้น - เริ่มต้นแผนที่
    const modal = document.getElementById('routePreviewModal');
    if (modal) {
        modal.addEventListener('shown.bs.modal', () => {
            console.log('📱 Preview modal opened, initializing map...');
            
            // รอให้ DOM render เสร็จ
            setTimeout(() => {
                this.initializeMap();
            }, 300);
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            this.cleanupPreviewModal();
        });
    }
},


// ฟังก์ชันแชร์เส้นทางจาก Preview
shareRoutePreview() {
    if (!this.currentPreviewData) {
        this.showToast('ไม่มีข้อมูลเส้นทางสำหรับแชร์', 'warning');
        return;
    }
    
    const students = this.currentPreviewData.students;
    const routeData = this.currentPreviewData.routeData;
    
    // สร้างข้อความแชร์
    const shareText = `🗺️ แผนการเยี่ยมบ้านนักเรียน
📅 วันที่: ${new Date().toLocaleDateString('th-TH')}
👥 จำนวน: ${students.length} ครัวเรือน
📏 ระยะทาง: ${routeData.totalDistance.toFixed(1)} กม.
⏱️ เวลา: ${routeData.estimatedTime.hours} ชม. ${routeData.estimatedTime.minutes} นาที
🚗 การเดินทาง: ${this.getTravelModeText()}

📋 รายการเยี่ยม:
${students.map((student, index) => `${index + 1}. ${student['ชื่อและนามสกุล']} (${student['ห้องเรียน']})`).join('\n')}

🌐 Google Maps: ${routeData.googleMapsUrl}`;
    
    // คัดลอกข้อความ
    this.copyToClipboard(shareText);
},

// Cleanup เมื่อปิด Preview Modal
cleanupPreviewModal() {
    console.log('🧹 Cleaning up route preview modal');
    
    // ลบแผนที่
    if (this.leafletMap) {
        this.leafletMap.remove();
        this.leafletMap = null;
    }
    
    // ล้างข้อมูล preview
    this.currentPreviewData = null;
    
    // ลบ modal element
    setTimeout(() => {
        this.removeExistingPreviewModal();
    }, 100);
},
// การ์ดสถิติเพื่อความเป็นระเบียบ
renderStatCard(icon, label, value) {
    return `
        <div class="col-6 col-md-3">
            <div class="bg-white rounded p-3 shadow-sm h-100">
                <div class="fs-2 mb-1">${icon}</div>
                <div class="fw-bold fs-5">${value}</div>
                <div class="text-muted small">${label}</div>
            </div>
        </div>
    `;
},

// สร้าง Timeline HTML
generateRouteTimelineHTML(students, routeData) {
    return students.map((student, index) => {
        const time = `${15 + Math.floor(index * 0.7)}:${(index * 42) % 60}`.padStart(5, '0');
        return `
            <div class="d-flex align-items-start mb-3">
                <div class="me-3 text-primary">${index + 1}</div>
                <div>
                    <div class="fw-semibold">${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</div>
                    <small class="text-muted">⏰ ${time} น. • ${student['ห้องเรียน'] || ''} • ${student.distanceFromSchool?.toFixed(1) || '?'} กม.</small>
                </div>
            </div>
        `;
    }).join('');
},

// สร้างรายละเอียดนักเรียน HTML
generateStudentDetailsHTML(students) {
    return students.map((student, i) => {
        const income = this.formatIncome(student['รายได้']);
        const visited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
        const priority = this.calculatePriorityScore(student);
        return `
            <div class="border-start border-4 ps-3 mb-3 ${visited ? 'border-success' : 'border-danger'}">
                <div class="fw-bold">${i + 1}. ${student['ชื่อและนามสกุล'] || '-'}</div>
                <small class="text-muted d-block">ห้องเรียน: ${student['ห้องเรียน'] || '-'} | รายได้: ${income} | ระยะทาง: ${student.distanceFromSchool?.toFixed(1) || '?'} กม.</small>
                <small class="badge bg-${priority >= 6 ? 'danger' : priority >= 4 ? 'warning' : 'success'} mt-1">ความสำคัญ: ${priority}</small>
            </div>
        `;
    }).join('');
},

// ฟอร์แมตรายได้
formatIncome(income) {
    if (!income) return 'ไม่ระบุ';
    const numIncome = parseFloat(income.toString().replace(/[฿,]/g, ''));
    if (isNaN(numIncome)) return 'ไม่ระบุ';
    return '฿' + numIncome.toLocaleString();
},

// แทนที่ฟังก์ชัน generateEmbedMapUrl และเพิ่มฟังก์ชันแผนที่ Interactive
generateEmbedMapUrl() {
    // ไม่ใช้ iframe แล้ว ให้ return empty string
    return '';
},

// ฟังก์ชันใหม่: สร้างแผนที่ Interactive ด้วย Leaflet
generateInteractiveMapHTML() {
    return `
        <div id="interactiveMapContainer" style="height: 400px; width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;">
            <div id="leafletMap" style="height: 100%; width: 100%;"></div>
            
            <!-- Loading indicator -->
            <div id="mapLoadingIndicator" class="position-absolute top-50 start-50 translate-middle" style="z-index: 1000;">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status"></div>
                    <div class="mt-2 small text-muted">กำลังโหลดแผนที่...</div>
                </div>
            </div>
        </div>
        
        <!-- โหลด Leaflet CSS และ JS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    `;
},

// ฟังก์ชันเริ่มต้นแผนที่
initializeMap(studentMarkers, schoolCoords) {
    console.log('🗺️ Starting map initialization...');
    
    // ตรวจสอบว่า Leaflet โหลดแล้วหรือยัง
    const initializeLeafletMap = () => {
        try {
            if (typeof L === 'undefined') {
                console.warn('⚠️ Leaflet not loaded yet, retrying...');
                setTimeout(initializeLeafletMap, 100);
                return;
            }
            
            // ซ่อน loading indicator
            const loadingEl = document.getElementById('mapLoadingIndicator');
            if (loadingEl) loadingEl.style.display = 'none';
            
            // ใช้ currentPreviewData ที่ถูกต้อง
            const previewData = this.currentPreviewData;
            if (!previewData || !previewData.students) {
                console.error('❌ No preview data available for map');
                this.showMapError('ไม่มีข้อมูลสำหรับแสดงแผนที่');
                return;
            }
            
            const schoolCoords = [14.222052, 99.472970];
            
            // เริ่มต้นแผนที่
            if (LeafletMapManager.initializeMap('leafletMap', schoolCoords)) {
                // เพิ่ม markers นักเรียน
                LeafletMapManager.addStudentMarkers(previewData.students);
                
                // วาดเส้นทาง
                LeafletMapManager.drawRoute(previewData.students);
                
                // เพิ่มปุ่มควบคุม
                LeafletMapManager.addCustomControls();
                
                // เก็บ reference
                this.leafletMap = LeafletMapManager.map;
                
                console.log('✅ Map initialized successfully with', previewData.students.length, 'students');
                
                // เรียก callback หากมี
                if (typeof this.onMapReady === 'function') {
                    this.onMapReady();
                }
            } else {
                this.showMapError('ไม่สามารถสร้างแผนที่ได้');
            }
            
        } catch (error) {
            console.error('❌ Map initialization error:', error);
            this.showMapError('เกิดข้อผิดพลาดในการโหลดแผนที่');
        }
    };
    
    // เริ่มต้นการโหลด
    setTimeout(initializeLeafletMap, 200);
},
  
  
  
// ============================================================================
// 3. เพิ่มฟังก์ชันแสดง Error
// ============================================================================
showMapError(message) {
    const mapContainer = document.getElementById('leafletMap');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100 text-muted bg-light">
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fs-1 mb-3 text-warning"></i>
                    <h6 class="mb-2">ไม่สามารถโหลดแผนที่ได้</h6>
                    <p class="small mb-3">${message}</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="RoutePlanningGoogle.retryMapLoad()">
                        <i class="fas fa-redo"></i> ลองใหม่
                    </button>
                </div>
            </div>
        `;
    }
    
    // ซ่อน loading indicator
    const loadingEl = document.getElementById('mapLoadingIndicator');
    if (loadingEl) loadingEl.style.display = 'none';
},

// ============================================================================
// 4. เพิ่มฟังก์ชัน Retry
// ============================================================================
retryMapLoad() {
    console.log('🔄 Retrying map load...');
    
    // แสดง loading indicator อีกครั้ง
    const mapContainer = document.getElementById('leafletMap');
    if (mapContainer) {
        mapContainer.innerHTML = '';
    }
    
    const loadingEl = document.getElementById('mapLoadingIndicator');
    if (loadingEl) loadingEl.style.display = 'block';
    
    // ลองโหลดแผนที่ใหม่
    setTimeout(() => {
        this.initializeMap();
    }, 500);
},


// ฟังก์ชันควบคุมแผนที่
centerMap() {
    if (this.leafletMap) {
        const schoolCoords = [14.222052, 99.472970];
        this.leafletMap.setView(schoolCoords, 12);
        this.showToast('กลับสู่จุดกลางแล้ว', 'info');
    } else {
        console.warn('⚠️ Map not initialized yet');
        this.showToast('แผนที่ยังไม่พร้อมใช้งาน', 'warning');
    }
},

toggleMapView() {
    const mapContainer = document.getElementById('interactiveMapContainer');
    if (!mapContainer) {
        console.warn('⚠️ Map container not found');
        return;
    }
    
    if (mapContainer.style.position === 'fixed') {
        // กลับสู่ขนาดปกติ
        mapContainer.style.position = 'relative';
        mapContainer.style.top = 'auto';
        mapContainer.style.left = 'auto';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '400px';
        mapContainer.style.zIndex = 'auto';
        mapContainer.style.backgroundColor = 'transparent';
        
        console.log('📱 Map returned to normal view');
    } else {
        // เต็มจอ
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '0';
        mapContainer.style.left = '0';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = '100vh';
        mapContainer.style.zIndex = '9999';
        mapContainer.style.backgroundColor = 'white';
        
        console.log('🔍 Map switched to fullscreen');
    }
    
    // รีเฟรชแผนที่เพื่อปรับขนาด
    setTimeout(() => {
        if (this.leafletMap) {
            this.leafletMap.invalidateSize();
            console.log('🔄 Map size refreshed');
        }
    }, 100);
},

// ฟังก์ชันสำหรับปุ่ม "กลับไปแก้ไข"
backToRoutePlanning() {
    console.log('🔙 Back to route planning - preserving selections:', this.tempSelections);
    
    // ✅ ตั้งค่าให้รู้ว่ากลับมาจาก preview
    this.fromPreviewBack = true;
    
    // ปิด preview modal
    const previewModal = bootstrap.Modal.getInstance(document.getElementById('routePreviewModal'));
    if (previewModal) {
        previewModal.hide();
    }
    
    // รอให้ modal ปิดแล้วเปิด modal เดิมพร้อม restore
    const previewModalElement = document.getElementById('routePreviewModal');
    previewModalElement.addEventListener('hidden.bs.modal', () => {
        setTimeout(() => {
            this.showRoutePlanningModal(); // จะ restore อัตโนมัติใน showRoutePlanningModal
        }, 200);
    }, { once: true });
},

// ฟังก์ชันสำหรับปุ่ม "เปิด Google Maps" จาก Preview
generateGoogleRouteFromPreview() {
    if (this.currentPreviewData && this.currentPreviewData.students) {
        const googleMapsUrl = this.currentPreviewData.routeData.googleMapsUrl;
        
        // เปิด Google Maps
        window.open(googleMapsUrl, '_blank');
        
        // บันทึกเส้นทางปัจจุบัน
        this.optimizedRoute = this.currentPreviewData.students;
        
        // แจ้งเตือนความสำเร็จ
        this.showToast(`เปิด Google Maps สำหรับ ${this.currentPreviewData.students.length} ครัวเรือนแล้ว`, 'success');
        
        // ปิด preview modal
        const previewModal = bootstrap.Modal.getInstance(document.getElementById('routePreviewModal'));
        if (previewModal) {
            previewModal.hide();
        }
        
        console.log('🗺️ Google Maps route generated from preview for', this.currentPreviewData.students.length, 'students');
    }
},

// ฟังก์ชันสำหรับพิมพ์ตัวอย่างเส้นทาง
printRoutePreview() {
    if (this.currentPreviewData) {
        // สร้างหน้าต่างใหม่สำหรับพิมพ์
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
            this.showToast('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup', 'error');
            return;
        }
        
        const printContent = this.generatePrintContent(this.currentPreviewData.students, this.currentPreviewData.routeData);
        
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // รอให้โหลดเสร็จแล้วพิมพ์
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
        };
        
        console.log('🖨️ Print preview generated');
    }
},

// สร้างเนื้อหาสำหรับพิมพ์
generatePrintContent(students, routeData) {
    const currentDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    return `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ตัวอย่างแผนการเยี่ยมบ้านนักเรียน</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>
                body { font-family: 'Sarabun', sans-serif; font-size: 14px; }
                .header { background: #1a73e8; color: white; padding: 20px; text-align: center; }
                .summary-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .timeline-item { border-left: 3px solid #28a745; padding-left: 15px; margin-bottom: 15px; }
                .student-card { border: 1px solid #dee2e6; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
                @media print {
                    .no-print { display: none !important; }
                    body { font-size: 12px; }
                    .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2><i class="fas fa-route"></i> แผนการเยี่ยมบ้านนักเรียน</h2>
                <p>${currentDate}</p>
            </div>
            
            <div class="container mt-4">
                <!-- สรุปข้อมูล -->
                <div class="summary-box">
                    <h4>📊 สรุปข้อมูลเส้นทาง</h4>
                    <div class="row">
                        <div class="col-3 text-center">
                            <h3 class="text-primary">${students.length}</h3>
                            <small>ครัวเรือน</small>
                        </div>
                        <div class="col-3 text-center">
                            <h3 class="text-success">${routeData.totalDistance.toFixed(1)}</h3>
                            <small>กิโลเมตร</small>
                        </div>
                        <div class="col-3 text-center">
                            <h3 class="text-warning">${routeData.estimatedTime.hours}:${String(routeData.estimatedTime.minutes).padStart(2, '0')}</h3>
                            <small>ชั่วโมง</small>
                        </div>
                        <div class="col-3 text-center">
                            <h3 class="text-info">${this.getTravelModeText()}</h3>
                            <small>การเดินทาง</small>
                        </div>
                    </div>
                </div>
                
                <!-- ลำดับการเยี่ยม -->
                <div class="row">
                    <div class="col-md-6">
                        <h4><i class="fas fa-list-ol"></i> ลำดับการเยี่ยม</h4>
                        ${this.generatePrintTimelineHTML(students, routeData)}
                    </div>
                    
                    <div class="col-md-6">
                        <h4><i class="fas fa-users"></i> รายละเอียดนักเรียน</h4>
                        ${this.generatePrintStudentDetailsHTML(students)}
                    </div>
                </div>
                
                <!-- หมายเหตุ -->
                <div class="mt-4 p-3 bg-light border-radius">
                    <h5><i class="fas fa-sticky-note"></i> หมายเหตุการใช้งาน</h5>
                    <ul>
                        <li>ตรวจสอบสภาพอากาศก่อนออกเยี่ยม</li>
                        <li>เตรียมอุปกรณ์: สมุดบันทึก, ปากกา, น้ำดื่ม</li>
                        <li>ติดต่อผู้ปกครองล่วงหน้า 1-2 วัน</li>
                        <li>บันทึกผลการเยี่ยมทันทีหลังเสร็จสิ้น</li>
                    </ul>
                </div>
                
                <div class="text-center mt-4">
                    <small class="text-muted">พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</small>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;
},

// สร้าง Timeline สำหรับพิมพ์
generatePrintTimelineHTML(students, routeData) {
    const startTime = new Date();
    startTime.setHours(15, 0, 0, 0);
    
    let currentTime = new Date(startTime);
    let timelineHTML = '';
    
    // จุดเริ่มต้น
    timelineHTML += `
        <div class="timeline-item">
            <strong>${currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong>
            - <i class="fas fa-school"></i> ออกจากโรงเรียน
        </div>
    `;
    
    // เวลาเดินทางไปบ้านแรก
    if (students.length > 0) {
        const firstStudent = students[0];
        const travelTimeToFirst = Math.round((firstStudent.distanceFromSchool || 0) * 2);
        currentTime.setMinutes(currentTime.getMinutes() + travelTimeToFirst);
    }
    
    // รายการเยี่ยม
    students.forEach((student, index) => {
        const visitDuration = 30;
        const endVisitTime = new Date(currentTime);
        endVisitTime.setMinutes(endVisitTime.getMinutes() + visitDuration);
        
        timelineHTML += `
            <div class="timeline-item">
                <strong>${currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - 
                ${endVisitTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong><br>
                <i class="fas fa-home"></i> ${student['ชื่อและนามสกุล']} (${student['ห้องเรียน']})<br>
                <small>ระยะทาง: ${student.distanceFromSchool ? student.distanceFromSchool.toFixed(1) + ' กม.' : 'ไม่ทราบ'}</small>
            </div>
        `;
        
        // เวลาถัดไป
        currentTime = new Date(endVisitTime);
        if (index < students.length - 1) {
            const nextStudent = students[index + 1];
            const travelTime = Math.round(this.calculateDistanceBetweenStudents(student, nextStudent) * 3) + 5;
            currentTime.setMinutes(currentTime.getMinutes() + travelTime);
        }
    });
    
    // กลับโรงเรียน
    if (students.length > 0) {
        const lastStudent = students[students.length - 1];
        const returnTime = Math.round((lastStudent.distanceFromSchool || 0) * 2);
        currentTime.setMinutes(currentTime.getMinutes() + returnTime);
        
        timelineHTML += `
            <div class="timeline-item">
                <strong>${currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong>
                - <i class="fas fa-school"></i> กลับโรงเรียน
            </div>
        `;
    }
    
    return timelineHTML;
},

// สร้างรายละเอียดนักเรียนสำหรับพิมพ์
generatePrintStudentDetailsHTML(students) {
    return students.map((student, index) => {
        const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
        const priorityScore = this.calculatePriorityScore(student);
        
        return `
            <div class="student-card">
                <strong>${index + 1}. ${student['ชื่อและนามสกุล']}</strong><br>
                <small>
                    ห้อง: ${student['ห้องเรียน']} | 
                    รายได้: ${this.formatIncome(student['รายได้'])} | 
                    ${isVisited ? '✅ เยี่ยมแล้ว' : '❌ ยังไม่เยี่ยม'}<br>
                    ความสำคัญ: ${priorityScore >= 6 ? 'สูง' : priorityScore >= 4 ? 'ปานกลาง' : 'ต่ำ'} (${priorityScore})
                </small>
            </div>
        `;
    }).join('');
},

// เพิ่มฟังก์ชันสำหรับ Waypoints ใน Embed Map
getWaypointsForEmbed() {
    if (this.currentPreviewData && this.currentPreviewData.students) {
        return this.currentPreviewData.students
            .map(student => {
                const coords = student['LatLongHome'];
                if (coords && coords.includes(',')) {
                    // ตัดช่องว่าง และเข้ารหัสพิกัดให้ปลอดภัยใน URL
                    return encodeURIComponent(coords.trim());
                }
                return null;
            })
            .filter(coord => coord !== null)
            .join('|'); // คั่นพิกัดด้วย | ตามรูปแบบ Google Maps Embed API
    }
    return '';
},

// ปรับปรุงฟังก์ชัน init เพื่อรองรับการปิด modal เดิม
init() {
    if (this.isInitialized) return;
    console.log('🚗 Initializing Route Planning with Google Maps...');
    
    // รอให้ระบบหลักโหลดเสร็จก่อน
    if (typeof map === 'undefined' || typeof homeVisitData === 'undefined') {
        setTimeout(() => this.init(), 1000);
        return;
    }
    
    this.createRouteButton();
    this.setupModalCleanup(); // เพิ่มการ setup cleanup
    this.isInitialized = true;
    console.log('✅ Route Planning with Google Maps loaded successfully');
},

// ตั้งค่าการ cleanup modal
setupModalCleanup() {
    // ฟังเหตุการณ์การปิด modal เพื่อ cleanup
    document.addEventListener('hidden.bs.modal', (event) => {
        const modalId = event.target.id;
        
        if (modalId === 'routePlanningGoogleModal') {
            this.cleanupMainModal();
        } else if (modalId === 'routePreviewModal') {
            this.cleanupPreviewModal();
        }
    });
},

// Cleanup Main Modal
cleanupMainModal() {
    console.log('🧹 Cleaning up main route planning modal');
    
    // ล้างข้อมูลการเลือก (ถ้าต้องการ)
    // this.clearSelection();
    
    // ล้างตัวแปรชั่วคราว
    this.tempSelections = null;
  
},

// Cleanup Preview Modal
cleanupPreviewModal() {
    console.log('🧹 Cleaning up route preview modal');
    
    // ลบแผนที่
    if (this.leafletMap) {
        try {
            this.leafletMap.remove();
            console.log('🗑️ Leaflet map removed');
        } catch (error) {
            console.warn('⚠️ Error removing map:', error);
        }
        this.leafletMap = null;
    }
    
    // ล้าง LeafletMapManager
    if (typeof LeafletMapManager !== 'undefined') {
        LeafletMapManager.destroy();
    }
    
    // ล้างข้อมูล preview
    this.currentPreviewData = null;
    
    // ลบ modal element
    setTimeout(() => {
        this.removeExistingPreviewModal();
    }, 100);
},
  
  openGoogleMapsFromPreview() {
    if (this.currentPreviewData && this.currentPreviewData.routeData) {
        const googleMapsUrl = this.currentPreviewData.routeData.googleMapsUrl;
        window.open(googleMapsUrl, '_blank');
        this.showToast('เปิด Google Maps แล้ว', 'success');
    } else {
        this.showToast('ไม่มีข้อมูลเส้นทางสำหรับเปิด Google Maps', 'warning');
    }
},
  
  
  ///////////////////////////////////////
    
    // สร้างเส้นทาง Google Maps
    generateGoogleRoute() {
        const selectedStudents = this.getSelectedStudents();
        const maxVisits = parseInt(document.getElementById('googleMaxVisits').value);
        
        if (selectedStudents.length === 0) {
            this.showToast('กรุณาเลือกนักเรียนที่ต้องการเยี่ยมก่อน', 'warning');
            return;
        }
        
        if (selectedStudents.length > maxVisits) {
            this.showToast(`เลือกได้สูงสุด ${maxVisits} ครัวเรือน (เลือกไว้ ${selectedStudents.length} ครัวเรือน)`, 'error');
            return;
        }
        
        // สร้าง URL และเปิด Google Maps
        const googleMapsUrl = this.generateGoogleMapsUrl(selectedStudents);
        
        // บันทึกเส้นทางปัจจุบัน
        this.optimizedRoute = selectedStudents;
        
        // เปิด Google Maps
        window.open(googleMapsUrl, '_blank');
        
        // แจ้งเตือนความสำเร็จ
        this.showToast(`เปิด Google Maps สำหรับ ${selectedStudents.length} ครัวเรือนแล้ว`, 'success');
        
        // ปิด modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('routePlanningGoogleModal'));
        if (modal) modal.hide();
        
        console.log('🗺️ Google Maps route generated for', selectedStudents.length, 'students');
    },
    
    // ดึงนักเรียนที่เลือก
    getSelectedStudents() {
        const selectedStudents = [];
        // เลือกเฉพาะ checkbox ที่ checked และ parent element แสดงผลอยู่
        document.querySelectorAll('.google-student-checkbox:checked').forEach(checkbox => {
            const parentItem = checkbox.closest('.google-student-item');
            // ตรวจสอบว่า item แสดงผลอยู่หรือไม่ (ไม่ถูกซ่อนจากการค้นหา)
            if (parentItem && parentItem.style.display !== 'none') {
                const studentIndex = parseInt(checkbox.value);
                const student = homeVisitData[studentIndex];
                if (student && student['LatLongHome']) {
                    selectedStudents.push({
                        ...student,
                        originalIndex: studentIndex
                    });
                }
            }
        });
        
        // เรียงลำดับตามการตั้งค่า
        return this.sortSelectedStudents(selectedStudents);
    },
    
    // เรียงลำดับนักเรียนที่เลือก
    sortSelectedStudents(students) {
        const sortBy = document.getElementById('googleSortBy').value;
        
        return students.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distanceFromSchool || 999) - (b.distanceFromSchool || 999);
                case 'priority':
                    return this.calculatePriorityScore(b) - this.calculatePriorityScore(a);
                case 'class':
                    return (a['ห้องเรียน'] || '').localeCompare(b['ห้องเรียน'] || '');
                case 'name':
                    return (a['ชื่อและนามสกุล'] || '').localeCompare(b['ชื่อและนามสกุล'] || '');
                default:
                    return 0;
            }
        });
    },
    
    // สร้าง URL สำหรับ Google Maps
    generateGoogleMapsUrl(students, preview = false) {
        // จุดเริ่มต้น (โรงเรียน)
        const schoolCoords = '14.222052,99.472970';
        
        // สร้างรายการจุดหยุด
        const waypoints = students.map(student => {
            const coords = student['LatLongHome'].replace(/\s+/g, '');
            return coords;
        }).join('|');
        
        // ประเภทการเดินทาง
        const travelMode = document.getElementById('googleTravelMode').value;
        
        // สร้าง URL
        let url = 'https://www.google.com/maps/dir/';
        
        // เพิ่มจุดเริ่มต้น
        url += `${schoolCoords}/`;
        
        // เพิ่มจุดหยุด
        students.forEach(student => {
            const coords = student['LatLongHome'].replace(/\s+/g, '');
            url += `${coords}/`;
        });
        
        // กลับโรงเรียน
        url += `${schoolCoords}/`;
        
        // เพิ่มพารามิเตอร์
        url += `?hl=th&dirflg=${this.getTravelModeCode(travelMode)}`;
        
        // เพิ่มการตั้งค่าเพิ่มเติม
        if (!preview) {
            url += '&travelmode=' + travelMode;
            url += '&units=metric';
        }
        
        return url;
    },
    
    // แปลงโหมดการเดินทาง
    getTravelModeCode(mode) {
        const modes = {
            'driving': 'd',
            'walking': 'w',
            'bicycling': 'b',
            'transit': 'r'
        };
        return modes[mode] || 'd';
    },
    
    // ได้ข้อความโหมดการเดินทาง
    getTravelModeText() {
        const mode = document.getElementById('googleTravelMode').value;
        const modes = {
            'driving': '🚗 ขับรถ',
            'walking': '🚶 เดินเท้า',
            'bicycling': '🚴 จักรยาน',
            'transit': '🚌 ขนส่งสาธารณะ'
        };
        return modes[mode] || 'ขับรถ';
    },
    
    // ได้ข้อความการเรียงลำดับ
    getSortByText() {
        const sortBy = document.getElementById('googleSortBy').value;
        const sorts = {
            'distance': 'ระยะทางใกล้สุด',
            'priority': 'ความสำคัญ',
            'class': 'ห้องเรียน',
            'name': 'ชื่อ A-Z'
        };
        return sorts[sortBy] || 'ระยะทางใกล้สุด';
    },
    
    // แชร์เส้นทาง
    shareRoute() {
        const selectedStudents = this.getSelectedStudents();
        if (selectedStudents.length === 0) {
            this.showToast('กรุณาเลือกนักเรียนที่ต้องการเยี่ยมก่อน', 'warning');
            return;
        }
        
        // สร้างข้อความแชร์
        const routeText = this.generateShareText(selectedStudents);
        
        // ตรวจสอบว่ามี LINE LIFF หรือไม่
        if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
            // แชร์ผ่าน LINE
            this.shareViaLine(routeText, selectedStudents);
        } else {
            // คัดลอกข้อความ
            this.copyToClipboard(routeText);
        }
    },
    
    // สร้างข้อความแชร์
    generateShareText(students) {
        const totalDistance = students.reduce((sum, student) => {
            return sum + (student.distanceFromSchool || 0);
        }, 0);
        
        const estimatedTime = students.length * 30 + totalDistance * 3;
        
        let text = `📍 แผนการเยี่ยมบ้านนักเรียน\n\n`;
        text += `🕐 วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
        text += `👥 จำนวน: ${students.length} ครัวเรือน\n`;
        text += `🚗 ประเภท: ${this.getTravelModeText()}\n`;
        text += `📏 ระยะทาง: ${totalDistance.toFixed(1)} กม. (ประมาณ)\n`;
        text += `⏱️ เวลา: ${Math.round(estimatedTime)} นาที (ประมาณ)\n\n`;
        
        text += `📋 รายการเยี่ยม:\n`;
        students.forEach((student, index) => {
            text += `${index + 1}. ${student['ชื่อและนามสกุล']} (${student['ห้องเรียน']})\n`;
        });
        
        text += `\n🗺️ Google Maps: ${this.generateGoogleMapsUrl(students)}`;
        
        return text;
    },
    
    // แชร์ผ่าน LINE
    shareViaLine(text, students) {
        if (typeof liff === 'undefined') {
            this.copyToClipboard(text);
            return;
        }
        
        // สร้าง Flex Message
        const flexMessage = {
            type: "flex",
            altText: "แผนการเยี่ยมบ้านนักเรียน",
            contents: {
                type: "bubble",
                size: "giga",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "📍 แผนการเยี่ยมบ้านนักเรียน",
                            weight: "bold",
                            size: "lg",
                            color: "#ffffff"
                        },
                        {
                            type: "text",
                            text: new Date().toLocaleDateString('th-TH'),
                            size: "sm",
                            color: "#ffffff",
                            margin: "sm"
                        }
                    ],
                    backgroundColor: "#28a745",
                    paddingAll: "20px"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "จำนวน:", flex: 2, size: "sm", color: "#aaaaaa" },
                                { type: "text", text: `${students.length} ครัวเรือน`, flex: 3, size: "sm", weight: "bold" }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "ประเภท:", flex: 2, size: "sm", color: "#aaaaaa" },
                                { type: "text", text: this.getTravelModeText(), flex: 3, size: "sm" }
                            ],
                            margin: "sm"
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "🗺️ เปิด Google Maps",
                                uri: this.generateGoogleMapsUrl(students)
                            },
                            color: "#4285f4"
                        }
                    ]
                }
            }
        };
        
        liff.shareTargetPicker([flexMessage])
            .then(() => {
                this.showToast('แชร์เส้นทางเรียบร้อยแล้ว', 'success');
            })
            .catch(error => {
                console.error('Error sharing:', error);
                this.copyToClipboard(text);
            });
    },
    
    // คัดลอกข้อความ
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('คัดลอกข้อมูลเส้นทางแล้ว', 'success');
            }).catch(() => {
                this.fallbackCopyTextToClipboard(text);
            });
        } else {
            this.fallbackCopyTextToClipboard(text);
        }
    },
    
    // วิธีคัดลอกสำรอง
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('คัดลอกข้อมูลเส้นทางแล้ว', 'success');
        } catch (err) {
            this.showToast('ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง', 'error');
        }
        
        document.body.removeChild(textArea);
    },
    
    // แสดงการแจ้งเตือน Toast
    showToast(message, type = 'info') {
        const toastId = 'googleRouteToast_' + Date.now();
        const bgClass = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        }[type] || 'bg-info';
        
        const icon = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        const toastHTML = `
            <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;">
                <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header ${bgClass} text-white">
                        <i class="${icon} me-2"></i>
                        <strong class="me-auto">Google Maps Route</strong>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `;
        
        // เพิ่ม toast
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        
        // แสดง toast
        const toast = new bootstrap.Toast(document.getElementById(toastId), {
            autohide: true,
            delay: type === 'error' ? 5000 : 3000
        });
        toast.show();
        
        // ลบ toast หลังจากปิด
        document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
            this.parentNode.remove();
        });
    }
};

// เริ่มต้นฟีเจอร์เมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // รอให้ระบบหลักโหลดเสร็จก่อน
    setTimeout(() => {
        RoutePlanningGoogle.init();
    }, 1500);
});

// ฟังการอัปเดตข้อมูล
document.addEventListener('dataLoaded', function() {
    if (RoutePlanningGoogle.isInitialized) {
        console.log('🔄 Google route planning data updated');
    }
});

// Enhanced Leaflet Map Integration สำหรับระบบเยี่ยมบ้าน
// ปรับปรุงจาก code เดิมเพื่อให้ใช้งานได้ดีขึ้น

const LeafletMapManager = {
    map: null,
    markers: [],
    routeLine: null,
    schoolMarker: null,
    
    // เริ่มต้นแผนที่
initializeMap(containerId, schoolCoords = [14.222052, 99.472970]) {
        try {
            console.log('🗺️ Initializing Leaflet map in container:', containerId);
            
            // ตรวจสอบว่า container มีอยู่จริง
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('❌ Map container not found:', containerId);
                return false;
            }
            
            // ลบแผนที่เก่า (ถ้ามี)
            if (this.map) {
                console.log('🗑️ Removing existing map');
                this.map.remove();
                this.map = null;
            }
            
            // ตรวจสอบว่า Leaflet โหลดแล้ว
            if (typeof L === 'undefined') {
                console.error('❌ Leaflet library not loaded');
                return false;
            }
            
            // สร้างแผนที่ใหม่
            this.map = L.map(containerId, {
                center: schoolCoords,
                zoom: 12,
                zoomControl: true,
                attributionControl: true,
                maxZoom: 18,
                minZoom: 8
            });
            
            // เพิ่ม tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
                minZoom: 8
            }).addTo(this.map);
            
            // เพิ่ม marker โรงเรียน
            this.addSchoolMarker(schoolCoords);
            
            console.log('✅ Leaflet map initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Map initialization failed:', error);
            return false;
        }
    },
    
    // เพิ่มฟังก์ชันตรวจสอบสถานะ
    isMapReady() {
        return this.map !== null && typeof L !== 'undefined';
    },
    
    // เพิ่มฟังก์ชัน retry
    retryInitialization(containerId, schoolCoords, maxRetries = 3) {
        let attempts = 0;
        
        const tryInit = () => {
            attempts++;
            console.log(`🔄 Map initialization attempt ${attempts}/${maxRetries}`);
            
            if (this.initializeMap(containerId, schoolCoords)) {
                return true;
            }
            
            if (attempts < maxRetries) {
                setTimeout(tryInit, 1000 * attempts); // รอนานขึ้นทุกครั้ง
            } else {
                console.error('❌ Map initialization failed after', maxRetries, 'attempts');
                return false;
            }
        };
        
        return tryInit();
    }
};

// แทนที่ LeafletMapManager เดิม
window.LeafletMapManager = LeafletMapManagerFixed;

// ============================================================================
// 10. เพิ่ม CSS สำหรับ Loading และ Error States
// ============================================================================
const additionalStyles = `
<style>
/* Map loading states */
#mapLoadingIndicator {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Map error states */
.map-error-container {
    background: #f8f9fa;
    border: 1px dashed #dee2e6;
    border-radius: 8px;
}

/* Map fullscreen improvements */
#interactiveMapContainer[style*="position: fixed"] {
    background: white !important;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

/* Leaflet popup improvements */
.leaflet-popup-content {
    font-family: inherit;
    line-height: 1.4;
}

.leaflet-popup-content-wrapper {
    border-radius: 8px;
}

/* Control buttons */
.leaflet-control-container .leaflet-control {
    margin: 5px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.leaflet-control-container .leaflet-control a {
    transition: all 0.2s ease;
}

.leaflet-control-container .leaflet-control a:hover {
    background: #007bff !important;
    color: white !important;
}

/* Responsive improvements */
@media (max-width: 768px) {
    #interactiveMapContainer {
        height: 300px !important;
    }
    
    .leaflet-control-container {
        font-size: 14px;
    }
}
</style>
`;

// เพิ่ม CSS
document.head.insertAdjacentHTML('beforeend', additionalStyles);

console.log('🔧 Leaflet map fixes applied successfully');