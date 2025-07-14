// features/route-planning.js
// ฟีเจอร์วางแผนเส้นทางเยี่ยมบ้านนักเรียน

const RoutePlanning = {
    isInitialized: false,
    currentRoute: null,
    optimizedRoute: [],
    routeLayer: null,
    markers: [],
    
    // เริ่มต้นฟีเจอร์
    init() {
        if (this.isInitialized) return;
        console.log('🚗 Initializing Route Planning Feature...');
        
        // รอให้ระบบหลักโหลดเสร็จก่อน
        if (typeof map === 'undefined' || typeof homeVisitData === 'undefined') {
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        this.createRouteButton();
        this.initializeRouteLayer();
        this.isInitialized = true;
        console.log('✅ Route Planning Feature loaded successfully');
    },
    
    // เพิ่มปุ่มวางแผนเส้นทาง
    createRouteButton() {
        const controlBar = document.querySelector('.btn-group');
        if (!controlBar) return;
        
        const routeBtn = document.createElement('button');
        routeBtn.id = 'routePlanningBtn';
        routeBtn.className = 'btn btn-outline-success btn-sm';
        routeBtn.innerHTML = '<i class="fas fa-route"></i> วางแผนเส้นทาง';
        routeBtn.onclick = () => this.showRoutePlanningModal();
        
        // เพิ่มหลังปุ่ม "กลับจุดเริ่มต้น"
        const centerBtn = document.getElementById('centerMapBtn');
        if (centerBtn && centerBtn.nextSibling) {
            controlBar.insertBefore(routeBtn, centerBtn.nextSibling);
        } else {
            controlBar.appendChild(routeBtn);
        }
    },
    
    // เริ่มต้น Route Layer
    initializeRouteLayer() {
        if (typeof L !== 'undefined' && map) {
            this.routeLayer = L.layerGroup().addTo(map);
        }
    },
    
    // แสดง Modal วางแผนเส้นทาง
    showRoutePlanningModal() {
        this.removeExistingModal();
        this.createRoutePlanningModal();
        this.populateStudentList();
        
        const modal = new bootstrap.Modal(document.getElementById('routePlanningModal'));
        modal.show();
    },
    
    // ลบ Modal เดิม (ถ้ามี)
    removeExistingModal() {
        const existingModal = document.getElementById('routePlanningModal');
        if (existingModal) {
            existingModal.remove();
        }
    },
    
    // สร้าง Modal
    createRoutePlanningModal() {
        const modalHTML = `
            <div class="modal fade" id="routePlanningModal" tabindex="-1" aria-labelledby="routePlanningModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title" id="routePlanningModalLabel">
                                <i class="fas fa-route"></i> วางแผนเส้นทางเยี่ยมบ้านนักเรียน
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- ส่วนควบคุม -->
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="mb-0"><i class="fas fa-cogs"></i> ตั้งค่าเส้นทาง</h6>
                                        </div>
                                        <div class="card-body">
                                            <!-- เลือกประเภทการเยี่ยม -->
                                            <div class="mb-3">
                                                <label class="form-label">ประเภทการเยี่ยม:</label>
                                                <select id="routeType" class="form-select form-select-sm">
                                                    <option value="all">ทุกเคส</option>
                                                    <option value="notVisited">ยังไม่เยี่ยม</option>
                                                    <option value="priority">ความสำคัญสูง</option>
                                                    <option value="nearSchool">ใกล้โรงเรียน</option>
                                                    <option value="custom">เลือกเอง</option>
                                                </select>
                                            </div>
                                            
                                            <!-- จำนวนการเยี่ยมต่อวัน -->
                                            <div class="mb-3">
                                                <label class="form-label">เยี่ยมต่อวัน:</label>
                                                <input type="number" id="visitsPerDay" class="form-control form-control-sm" value="5" min="1" max="20">
                                            </div>
                                            
                                            <!-- เวลาเริ่มต้น -->
                                            <div class="mb-3">
                                                <label class="form-label">เวลาเริ่มต้น:</label>
                                                <input type="time" id="startTime" class="form-control form-control-sm" value="08:00">
                                            </div>
                                            
                                            <!-- เวลาแต่ละครัวเรือน -->
                                            <div class="mb-3">
                                                <label class="form-label">เวลาต่อครัวเรือน (นาที):</label>
                                                <input type="number" id="timePerVisit" class="form-control form-control-sm" value="30" min="15" max="120">
                                            </div>
                                            
                                            <!-- ปุ่มควบคุม -->
                                            <div class="d-grid gap-2">
                                                <button type="button" class="btn btn-primary btn-sm" onclick="RoutePlanning.generateRoute()">
                                                    <i class="fas fa-magic"></i> สร้างเส้นทางอัตโนมัติ
                                                </button>
                                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="RoutePlanning.clearRoute()">
                                                    <i class="fas fa-trash"></i> ล้างเส้นทาง
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- สรุปเส้นทาง -->
                                    <div class="card mt-3" id="routeSummaryCard" style="display: none;">
                                        <div class="card-header">
                                            <h6 class="mb-0"><i class="fas fa-info-circle"></i> สรุปเส้นทาง</h6>
                                        </div>
                                        <div class="card-body">
                                            <div id="routeSummary">
                                                <!-- สรุปจะแสดงที่นี่ -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- รายการนักเรียน -->
                                <div class="col-md-8">
                                    <div class="card">
                                        <div class="card-header d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0"><i class="fas fa-list"></i> รายการนักเรียน</h6>
                                            <div>
                                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="RoutePlanning.selectAll()">
                                                    <i class="fas fa-check-square"></i> เลือกทั้งหมด
                                                </button>
                                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="RoutePlanning.unselectAll()">
                                                    <i class="fas fa-square"></i> ยกเลิกทั้งหมด
                                                </button>
                                            </div>
                                        </div>
                                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                                            <div id="studentListContainer">
                                                <div class="text-center">
                                                    <div class="spinner-border spinner-border-sm" role="status"></div>
                                                    <small class="ms-2">กำลังโหลดรายการ...</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- เส้นทางที่สร้าง -->
                                    <div class="card mt-3" id="routeListCard" style="display: none;">
                                        <div class="card-header">
                                            <h6 class="mb-0"><i class="fas fa-route"></i> เส้นทางที่แนะนำ</h6>
                                        </div>
                                        <div class="card-body" style="max-height: 200px; overflow-y: auto;">
                                            <div id="routeListContainer">
                                                <!-- รายการเส้นทางจะแสดงที่นี่ -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-info" onclick="RoutePlanning.exportRoute()">
                                <i class="fas fa-download"></i> ส่งออกเส้นทาง
                            </button>
                            <button type="button" class="btn btn-success" onclick="RoutePlanning.applyRoute()">
                                <i class="fas fa-check"></i> ใช้เส้นทางนี้
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> ปิด
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // ตั้งค่า event listeners
        document.getElementById('routeType').addEventListener('change', () => this.onRouteTypeChanged());
    },
    
    // โหลดรายการนักเรียน
    populateStudentList() {
        const container = document.getElementById('studentListContainer');
        if (!homeVisitData || homeVisitData.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">ไม่พบข้อมูลนักเรียน</div>';
            return;
        }
        
        // กรองนักเรียนที่มีพิกัด
        const studentsWithCoords = homeVisitData.filter(student => {
            return student['LatLongHome'] && student['LatLongHome'].includes(',');
        });
        
        if (studentsWithCoords.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">ไม่พบนักเรียนที่มีพิกัดที่อยู่</div>';
            return;
        }
        
        const studentListHTML = studentsWithCoords.map((student, index) => {
            const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
            const distance = student.distanceFromSchool ? 
                `${student.distanceFromSchool.toFixed(1)} กม.` : 'ไม่ทราบ';
            
            const statusBadge = isVisited ? 
                '<span class="badge bg-success">เยี่ยมแล้ว</span>' : 
                '<span class="badge bg-danger">ยังไม่เยี่ยม</span>';
            
            return `
                <div class="form-check border rounded p-2 mb-2 student-item" data-index="${index}">
                    <input class="form-check-input student-checkbox" type="checkbox" value="${index}" id="student_${index}" ${!isVisited ? 'checked' : ''}>
                    <label class="form-check-label w-100" for="student_${index}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</strong>
                                <small class="text-muted d-block">${student['ห้องเรียน'] || ''} • ${distance}</small>
                            </div>
                            <div class="text-end">
                                ${statusBadge}
                            </div>
                        </div>
                    </label>
                </div>
            `;
        }).join('');
        
        container.innerHTML = studentListHTML;
        
        // เพิ่ม event listeners
        document.querySelectorAll('.student-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.onStudentSelectionChanged());
        });
    },
    
    // เมื่อเปลี่ยนประเภทการเยี่ยม
    onRouteTypeChanged() {
        const routeType = document.getElementById('routeType').value;
        const checkboxes = document.querySelectorAll('.student-checkbox');
        
        checkboxes.forEach((checkbox, index) => {
            const student = homeVisitData[parseInt(checkbox.value)];
            let shouldCheck = false;
            
            switch (routeType) {
                case 'all':
                    shouldCheck = true;
                    break;
                case 'notVisited':
                    shouldCheck = student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว';
                    break;
                case 'priority':
                    shouldCheck = this.isPriorityCase(student);
                    break;
                case 'nearSchool':
                    shouldCheck = student.distanceFromSchool && student.distanceFromSchool < 3;
                    break;
                case 'custom':
                    // ให้ผู้ใช้เลือกเอง
                    return;
            }
            
            checkbox.checked = shouldCheck;
        });
        
        this.onStudentSelectionChanged();
    },
    
    // ตรวจสอบว่าเป็นเคสสำคัญหรือไม่
    isPriorityCase(student) {
        let priority = 0;
        
        // ยังไม่เยี่ยม
        if (student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว') priority += 3;
        
        // รายได้ต่ำ
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0 && income < 10000) priority += 2;
        
        // ได้สวัสดิการ
        if (student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE') priority += 1;
        
        // มีภาระพึ่งพิง
        if (student['ครัวเรือนมีภาระพึ่งพิง']) priority += 1;
        
        return priority >= 4; // ความสำคัญกลางขึ้นไป
    },
    
    // เมื่อเปลี่ยนการเลือกนักเรียน
    onStudentSelectionChanged() {
        const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;
        const routeBtn = document.querySelector('#routePlanningModal .btn-primary');
        
        if (routeBtn) {
            routeBtn.disabled = selectedCount === 0;
            routeBtn.innerHTML = selectedCount > 0 ? 
                `<i class="fas fa-magic"></i> สร้างเส้นทาง (${selectedCount} คน)` : 
                '<i class="fas fa-magic"></i> สร้างเส้นทางอัตโนมัติ';
        }
    },
    
    // เลือกทั้งหมด
    selectAll() {
        document.querySelectorAll('.student-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        this.onStudentSelectionChanged();
    },
    
    // ยกเลิกทั้งหมด
    unselectAll() {
        document.querySelectorAll('.student-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.onStudentSelectionChanged();
    },
    
    // สร้างเส้นทางอัตโนมัติ
    generateRoute() {
        const selectedStudents = this.getSelectedStudents();
        if (selectedStudents.length === 0) {
            alert('กรุณาเลือกนักเรียนที่ต้องการเยี่ยม');
            return;
        }
        
        console.log('🔄 Generating route for', selectedStudents.length, 'students...');
        
        // แสดงสถานะกำลังสร้าง
        this.showRouteGenerating();
        
        // สร้างเส้นทางที่เหมาะสม
        setTimeout(() => {
            this.optimizedRoute = this.calculateOptimalRoute(selectedStudents);
            this.displayRoute();
            this.showRouteOnMap();
            this.updateRouteSummary();
        }, 1000);
    },
    
    // ดึงนักเรียนที่เลือก
    getSelectedStudents() {
        const selectedStudents = [];
        document.querySelectorAll('.student-checkbox:checked').forEach(checkbox => {
            const studentIndex = parseInt(checkbox.value);
            const student = homeVisitData[studentIndex];
            if (student && student['LatLongHome']) {
                selectedStudents.push({
                    ...student,
                    originalIndex: studentIndex
                });
            }
        });
        return selectedStudents;
    },
    
    // คำนวณเส้นทางที่เหมาะสม (Nearest Neighbor Algorithm)
    calculateOptimalRoute(students) {
        if (students.length === 0) return [];
        
        // จุดเริ่มต้น (โรงเรียน)
        const schoolCoords = [14.222052, 99.472970];
        const route = [];
        const remaining = [...students];
        let currentLocation = schoolCoords;
        
        // เพิ่มจุดเริ่มต้น
        route.push({
            type: 'school',
            name: 'โรงเรียน',
            coords: schoolCoords,
            time: document.getElementById('startTime').value,
            duration: 0
        });
        
        const timePerVisit = parseInt(document.getElementById('timePerVisit').value) || 30;
        let currentTime = this.parseTime(document.getElementById('startTime').value);
        
        // หานักเรียนที่ใกล้ที่สุดในแต่ละขั้นตอน
        while (remaining.length > 0) {
            let nearestIndex = 0;
            let shortestDistance = Infinity;
            
            remaining.forEach((student, index) => {
                const studentCoords = this.parseCoordinates(student['LatLongHome']);
                if (studentCoords) {
                    const distance = this.calculateDistance(currentLocation, studentCoords);
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestIndex = index;
                    }
                }
            });
            
            const nextStudent = remaining[nearestIndex];
            const nextCoords = this.parseCoordinates(nextStudent['LatLongHome']);
            
            if (nextCoords) {
                // เพิ่มเวลาเดินทาง (ประมาณ)
                const travelTime = Math.round(shortestDistance * 3); // 3 นาที/กิโลเมตร
                currentTime += travelTime;
                
                route.push({
                    type: 'student',
                    student: nextStudent,
                    coords: nextCoords,
                    time: this.formatTime(currentTime),
                    duration: timePerVisit,
                    distance: shortestDistance,
                    travelTime: travelTime
                });
                
                // เพิ่มเวลาการเยี่ยม
                currentTime += timePerVisit;
                
                currentLocation = nextCoords;
                remaining.splice(nearestIndex, 1);
            } else {
                remaining.splice(nearestIndex, 1);
            }
        }
        
        // กลับโรงเรียน
        const returnDistance = this.calculateDistance(currentLocation, schoolCoords);
        const returnTravelTime = Math.round(returnDistance * 3);
        currentTime += returnTravelTime;
        
        route.push({
            type: 'return',
            name: 'กลับโรงเรียน',
            coords: schoolCoords,
            time: this.formatTime(currentTime),
            distance: returnDistance,
            travelTime: returnTravelTime
        });
        
        return route;
    },
    
    // แปลงพิกัด
    parseCoordinates(latLongStr) {
        if (!latLongStr || !latLongStr.includes(',')) return null;
        const [lat, lng] = latLongStr.split(',').map(coord => parseFloat(coord.trim()));
        return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
    },
    
    // คำนวณระยะทาง
    calculateDistance(coord1, coord2) {
        const R = 6371; // รัศมีโลก
        const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
        const dLng = (coord2[1] - coord1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },
    
    // แปลงเวลา
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
        return hours * 60 + minutes;
    },
    
    // แปลงเวลากลับ
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },
    
    // แสดงสถานะกำลังสร้าง
    showRouteGenerating() {
        const routeListCard = document.getElementById('routeListCard');
        const routeContainer = document.getElementById('routeListContainer');
        
        routeContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                <small class="ms-2">กำลังคำนวณเส้นทางที่เหมาะสม...</small>
            </div>
        `;
        
        routeListCard.style.display = 'block';
    },
    
    // แสดงรายการเส้นทาง
    displayRoute() {
        const routeContainer = document.getElementById('routeListContainer');
        const routeListCard = document.getElementById('routeListCard');
        
        if (this.optimizedRoute.length === 0) {
            routeContainer.innerHTML = '<div class="text-muted">ไม่สามารถสร้างเส้นทางได้</div>';
            return;
        }
        
        const routeHTML = this.optimizedRoute.map((stop, index) => {
            if (stop.type === 'school') {
                return `
                    <div class="d-flex align-items-center mb-2 p-2 bg-primary text-white rounded">
                        <div class="badge bg-light text-dark me-2">${index + 1}</div>
                        <div class="flex-grow-1">
                            <strong><i class="fas fa-school"></i> ${stop.name}</strong>
                            <small class="d-block">เวลา: ${stop.time}</small>
                        </div>
                    </div>
                `;
            } else if (stop.type === 'student') {
                return `
                    <div class="d-flex align-items-center mb-2 p-2 border rounded">
                        <div class="badge bg-success me-2">${index + 1}</div>
                        <div class="flex-grow-1">
                            <strong>${stop.student['ชื่อและนามสกุล']}</strong>
                            <small class="d-block text-muted">
                                ${stop.student['ห้องเรียน']} • 
                                เวลา: ${stop.time} (${stop.duration} นาที) • 
                                ระยะทาง: ${stop.distance.toFixed(1)} กม.
                            </small>
                        </div>
                        <button class="btn btn-outline-primary btn-sm" onclick="RoutePlanning.focusOnStop(${index})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;
            } else if (stop.type === 'return') {
                return `
                    <div class="d-flex align-items-center mb-2 p-2 bg-secondary text-white rounded">
                        <div class="badge bg-light text-dark me-2">${index + 1}</div>
                        <div class="flex-grow-1">
                            <strong><i class="fas fa-home"></i> ${stop.name}</strong>
                            <small class="d-block">
                                เวลา: ${stop.time} • 
                                ระยะทาง: ${stop.distance.toFixed(1)} กม.
                            </small>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        routeContainer.innerHTML = routeHTML;
        routeListCard.style.display = 'block';
    },
    
    // แสดงเส้นทางบนแผนที่
    showRouteOnMap() {
        if (!map || !this.routeLayer) return;
        
        // ล้างเส้นทางเดิม
        this.routeLayer.clearLayers();
        
        // สร้างเส้นทาง
        const routeCoords = this.optimizedRoute.map(stop => stop.coords);
        
        if (routeCoords.length > 1) {
            // วาดเส้นทาง
            const routeLine = L.polyline(routeCoords, {
                color: '#28a745',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
            });
            
            this.routeLayer.addLayer(routeLine);
            
            // เพิ่ม markers สำหรับจุดหยุด
            this.optimizedRoute.forEach((stop, index) => {
                let markerIcon, popupContent;
                
                if (stop.type === 'school') {
                    markerIcon = L.divIcon({
                        className: 'route-marker school-marker',
                        html: `<div style="background: #007bff; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });
                    popupContent = `<strong>จุดเริ่มต้น: ${stop.name}</strong><br>เวลา: ${stop.time}`;
                } else if (stop.type === 'student') {
                    markerIcon = L.divIcon({
                        className: 'route-marker student-marker',
                        html: `<div style="background: #28a745; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });
                    popupContent = `
                        <strong>จุดที่ ${index + 1}: ${stop.student['ชื่อและนามสกุล']}</strong><br>
                        ห้อง: ${stop.student['ห้องเรียน']}<br>
                        เวลา: ${stop.time}<br>
                        ระยะทาง: ${stop.distance.toFixed(1)} กม.<br>
                        ระยะเวลา: ${stop.duration} นาที
                    `;
                } else if (stop.type === 'return') {
                    markerIcon = L.divIcon({
                        className: 'route-marker return-marker',
                        html: `<div style="background: #6c757d; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });
                    popupContent = `<strong>จุดสิ้นสุด: ${stop.name}</strong><br>เวลา: ${stop.time}<br>ระยะทาง: ${stop.distance.toFixed(1)} กม.`;
                }
                
                if (markerIcon) {
                    const marker = L.marker(stop.coords, { icon: markerIcon });
                    marker.bindPopup(popupContent);
                    this.routeLayer.addLayer(marker);
                }
            });
            
            // ปรับแผนที่ให้เห็นเส้นทางทั้งหมด
            map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
        }
    },
    
    // โฟกัสไปที่จุดหยุดในเส้นทาง
    focusOnStop(stopIndex) {
        if (!map || !this.optimizedRoute[stopIndex]) return;
        
        const stop = this.optimizedRoute[stopIndex];
        map.setView(stop.coords, 16, { animate: true });
        
        // หา marker และเปิด popup
        this.routeLayer.eachLayer(layer => {
            if (layer.getLatLng && 
                layer.getLatLng().lat === stop.coords[0] && 
                layer.getLatLng().lng === stop.coords[1]) {
                layer.openPopup();
            }
        });
    },
    
    // อัปเดตสรุปเส้นทาง
    updateRouteSummary() {
        const summaryCard = document.getElementById('routeSummaryCard');
        const summaryContainer = document.getElementById('routeSummary');
        
        if (this.optimizedRoute.length === 0) {
            summaryCard.style.display = 'none';
            return;
        }
        
        // คำนวณสถิติ
        const studentStops = this.optimizedRoute.filter(stop => stop.type === 'student');
        const totalDistance = this.optimizedRoute.reduce((sum, stop) => sum + (stop.distance || 0), 0);
        const totalTime = this.optimizedRoute.length > 0 ? 
            this.parseTime(this.optimizedRoute[this.optimizedRoute.length - 1].time) - 
            this.parseTime(this.optimizedRoute[0].time) : 0;
        
        const startTime = this.optimizedRoute[0].time;
        const endTime = this.optimizedRoute[this.optimizedRoute.length - 1].time;
        
        const summaryHTML = `
            <div class="row g-2 text-center">
                <div class="col-6">
                    <div class="bg-light p-2 rounded">
                        <h6 class="text-primary mb-1">${studentStops.length}</h6>
                        <small>ครัวเรือน</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-light p-2 rounded">
                        <h6 class="text-success mb-1">${totalDistance.toFixed(1)} กม.</h6>
                        <small>ระยะทางรวม</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-light p-2 rounded">
                        <h6 class="text-warning mb-1">${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}</h6>
                        <small>เวลารวม</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-light p-2 rounded">
                        <h6 class="text-info mb-1">${startTime} - ${endTime}</h6>
                        <small>ช่วงเวลา</small>
                    </div>
                </div>
            </div>
            
            <hr>
            
            <div class="text-center">
                <small class="text-muted">
                    <i class="fas fa-info-circle"></i> 
                    เส้นทางคำนวณจากระยะทางที่สั้นที่สุด<br>
                    เวลาอาจแตกต่างตามสภาพการจราจรจริง
                </small>
            </div>
        `;
        
        summaryContainer.innerHTML = summaryHTML;
        summaryCard.style.display = 'block';
    },
    
    // ล้างเส้นทาง
    clearRoute() {
        this.optimizedRoute = [];
        
        // ล้างแผนที่
        if (this.routeLayer) {
            this.routeLayer.clearLayers();
        }
        
        // ซ่อน UI
        document.getElementById('routeListCard').style.display = 'none';
        document.getElementById('routeSummaryCard').style.display = 'none';
        
        // รีเซ็ตปุ่ม
        const routeBtn = document.querySelector('#routePlanningModal .btn-primary');
        if (routeBtn) {
            const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;
            routeBtn.innerHTML = selectedCount > 0 ? 
                `<i class="fas fa-magic"></i> สร้างเส้นทาง (${selectedCount} คน)` : 
                '<i class="fas fa-magic"></i> สร้างเส้นทางอัตโนมัติ';
        }
        
        console.log('🗑️ Route cleared');
    },
    
    // ใช้เส้นทาง
    applyRoute() {
        if (this.optimizedRoute.length === 0) {
            alert('กรุณาสร้างเส้นทางก่อน');
            return;
        }
        
        // ปิด modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('routePlanningModal'));
        if (modal) modal.hide();
        
        // แจ้งเตือนการใช้งาน
        const studentCount = this.optimizedRoute.filter(stop => stop.type === 'student').length;
        const totalDistance = this.optimizedRoute.reduce((sum, stop) => sum + (stop.distance || 0), 0);
        
        if (confirm(`ต้องการใช้เส้นทางนี้หรือไม่?\n\nจำนวนครัวเรือน: ${studentCount}\nระยะทางรวม: ${totalDistance.toFixed(1)} กม.\n\nเส้นทางจะแสดงบนแผนที่หลัก`)) {
            // เก็บเส้นทางปัจจุบัน
            this.currentRoute = [...this.optimizedRoute];
            
            // แจ้งเตือนความสำเร็จ
            this.showSuccessNotification();
            
            console.log('✅ Route applied successfully');
        }
    },
    
    // แสดงการแจ้งเตือนความสำเร็จ
    showSuccessNotification() {
        // สร้าง toast notification
        const toastHTML = `
            <div class="toast-container position-fixed top-0 end-0 p-3">
                <div id="routeSuccessToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-success text-white">
                        <i class="fas fa-route me-2"></i>
                        <strong class="me-auto">เส้นทางเยี่ยมบ้าน</strong>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        เส้นทางถูกนำไปใช้เรียบร้อยแล้ว!<br>
                        <small class="text-muted">คุณสามารถดูเส้นทางบนแผนที่หลักได้</small>
                    </div>
                </div>
            </div>
        `;
        
        // เพิ่ม toast
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        
        // แสดง toast
        const toast = new bootstrap.Toast(document.getElementById('routeSuccessToast'));
        toast.show();
        
        // ลบ toast หลังจากปิด
        document.getElementById('routeSuccessToast').addEventListener('hidden.bs.toast', function() {
            this.parentNode.remove();
        });
    },
    
    // ส่งออกเส้นทาง
    exportRoute() {
        if (this.optimizedRoute.length === 0) {
            alert('กรุณาสร้างเส้นทางก่อน');
            return;
        }
        
        // สร้างข้อมูล CSV
        const headers = ['ลำดับ', 'ประเภท', 'ชื่อ-สถานที่', 'ห้องเรียน', 'เวลา', 'ระยะเวลา', 'ระยะทาง (กม.)', 'หมายเหตุ'];
        
        const csvData = this.optimizedRoute.map((stop, index) => {
            if (stop.type === 'school') {
                return [
                    index + 1,
                    'จุดเริ่มต้น',
                    stop.name,
                    '-',
                    stop.time,
                    '-',
                    '-',
                    'ออกเดินทางจากโรงเรียน'
                ];
            } else if (stop.type === 'student') {
                return [
                    index + 1,
                    'เยี่ยมบ้าน',
                    stop.student['ชื่อและนามสกุล'],
                    stop.student['ห้องเรียน'],
                    stop.time,
                    `${stop.duration} นาที`,
                    stop.distance.toFixed(1),
                    `รายได้: ${stop.student['รายได้'] || 'ไม่ระบุ'}`
                ];
            } else if (stop.type === 'return') {
                return [
                    index + 1,
                    'จุดสิ้นสุด',
                    stop.name,
                    '-',
                    stop.time,
                    '-',
                    stop.distance.toFixed(1),
                    'กลับสู่โรงเรียน'
                ];
            }
        });
        
        // สร้าง CSV content
        const csvContent = [headers, ...csvData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        // เพิ่มสรุปท้ายไฟล์
        const summary = [
            '',
            'สรุปเส้นทาง',
            `จำนวนครัวเรือนที่เยี่ยม,${this.optimizedRoute.filter(s => s.type === 'student').length}`,
            `ระยะทางรวม,${this.optimizedRoute.reduce((sum, stop) => sum + (stop.distance || 0), 0).toFixed(1)} กม.`,
            `เวลาเริ่มต้น,${this.optimizedRoute[0]?.time || '-'}`,
            `เวลาสิ้นสุด,${this.optimizedRoute[this.optimizedRoute.length - 1]?.time || '-'}`,
            `วันที่สร้าง,${new Date().toLocaleDateString('th-TH')}`
        ];
        
        const finalContent = csvContent + '\n' + summary.join('\n');
        
        // Download file
        const blob = new Blob(['\ufeff' + finalContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `เส้นทางเยี่ยมบ้าน_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📊 Route exported successfully');
    },
    
    // ฟังก์ชันช่วยเหลือ - ล้างข้อมูลเมื่อโหลดข้อมูลใหม่
    onDataUpdated() {
        this.clearRoute();
        console.log('🔄 Route planning data updated');
    }
};

// เริ่มต้นฟีเจอร์เมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // รอให้ระบบหลักโหลดเสร็จก่อน
    setTimeout(() => {
        RoutePlanning.init();
    }, 1500);
});

// ฟังการอัปเดตข้อมูล
document.addEventListener('dataLoaded', function() {
    RoutePlanning.onDataUpdated();
});