// =================================================================
// 🗺️ MAP CORE - ไฟล์ JavaScript หลักสำหรับแผนที่เยี่ยมบ้าน
// =================================================================

// Global variables
let map;
let homeVisitData = [];
let currentSemester = '';
let schoolMarker;
let markersLayer;
let currentFilters = {};
let clusterGroup;
let heatmapLayer;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    populateSemesterDropdown();
    initializeLiff();
    setupEventListeners();
    loadFooter();
    
    // Initialize additional systems
    if (typeof initializePriorityModal === 'function') {
        initializePriorityModal();
    }
    if (typeof loadStudentNotes === 'function') {
        loadStudentNotes();
    }
    if (typeof createNotificationBar === 'function') {
        createNotificationBar();
    }
    if (typeof requestNotificationPermission === 'function') {
        requestNotificationPermission();
    }
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Auto-check urgent cases every 5 minutes
    setInterval(() => {
        if (currentSemester && typeof checkUrgentCases === 'function' && notificationSettings?.autoCheck) {
            checkUrgentCases();
        }
    }, 300000);
    
    // Auto-refresh data every 5 minutes
    setInterval(() => {
        if (currentSemester) {
            loadMapData(currentSemester);
        }
    }, 300000);
});

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
        const coordsElement = document.getElementById('mouseCoords');
        if (coordsElement) {
            coordsElement.textContent = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        }
    });

    map.on('zoomend', function() {
        const zoomElement = document.getElementById('zoomLevel');
        if (zoomElement) {
            zoomElement.textContent = map.getZoom();
        }
    });

    map.on('click', function(e) {
        const mapInfoElement = document.getElementById('mapInfo');
        if (mapInfoElement) {
            mapInfoElement.style.display = 'block';
        }
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
        
        // Check for urgent cases
        if (typeof checkUrgentCases === 'function') {
            checkUrgentCases();
        }
        if (typeof showNotificationBar === 'function') {
            showNotificationBar();
        }
        
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
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = createStudentMarker(student, lat, lng);
                markersLayer.addLayer(marker);
            }
        }
    });
}

// Create marker for student
function createStudentMarker(student, lat, lng) {
    const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
    const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
    const hasWelfare = student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE';
    const isLowIncome = income > 0 && income < 10000;
    
    let markerColor = isVisited ? '#28a745' : '#dc3545';
    let borderColor = 'white';
    let markerSize = 15;
    
    // Special styling for urgent cases
    if (!isVisited && isLowIncome && hasWelfare) {
        borderColor = '#ffc107';
        markerSize = 18;
        markerColor = 'linear-gradient(45deg, #dc3545, #ffc107)';
    }
    
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'student-marker',
            html: `<div style="background: ${markerColor}; width: ${markerSize}px; height: ${markerSize}px; border-radius: 50%; border: 2px solid ${borderColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.3); ${!isVisited ? 'animation: pulse 2s infinite;' : ''}"></div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize/2, markerSize/2]
        }),
        type: 'student',
        studentName: student['ชื่อและนามสกุล']
    });

    const popupContent = createEnhancedPopupContent(student);
    
    marker.bindPopup(popupContent, {
        autoPan: true,
        autoPanPadding: [10, 10],
        autoPanPaddingTopLeft: [10, 10],
        autoPanPaddingBottomRight: [10, 10],
        keepInView: true,
        maxWidth: 300,
        maxHeight: 400,
        offset: [0, -10]
    });
    
    return marker;
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
            
            <div class="text-center mt-3">
                <button class="btn btn-sm btn-outline-success me-1" onclick="showNotesModal('${student['ชื่อและนามสกุล']}')" title="หมายเหตุ">
                    <i class="fas fa-sticky-note"></i> หมายเหตุ
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="viewStudentDetails('${student['ชื่อและนามสกุล']}')" title="รายละเอียด">
                    <i class="fas fa-eye"></i> รายละเอียด
                </button>
            </div>
            
            ${student['ครัวเรือนมีภาระพึ่งพิง'] ? 
                `<div class="alert alert-warning p-2 mb-0 mt-2" style="font-size: 11px;">
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

// Center map to initial position
function centerMap() {
    centerMapOnSchool();
    const mapInfoElement = document.getElementById('mapInfo');
    if (mapInfoElement) {
        mapInfoElement.style.display = 'none';
    }
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

// Update advanced statistics
function updateAdvancedStatistics() {
    // Get current time in Thailand timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Today's visits
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

// Wrapper functions for backward compatibility
function updateMapMarkers() {
    updateMarkersWithData(homeVisitData);
}

function updateStatistics() {
    updateStatisticsWithData(homeVisitData);
}

// Update priority cases (basic version - will be enhanced in priority file)
function updatePriorityCases() {
    const priorityContainer = document.getElementById('urgentCases');
    if (!priorityContainer) return;
    
    // Basic implementation - enhanced version in map-notifications.js
    if (typeof updateUrgentCasesDisplay === 'function') {
        // Use advanced version if available
        setTimeout(updateUrgentCasesDisplay, 100);
    } else {
        // Fallback basic version
        priorityContainer.innerHTML = '<div class="text-center"><small class="text-muted">กำลังโหลดระบบเคสด่วน...</small></div>';
    }
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

// Focus on student marker on map
function focusOnStudentMap(studentName) {
    const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
    if (student && student['LatLongHome']) {
        const [lat, lng] = student['LatLongHome'].split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 16);
            
            // หา marker ของนักเรียนและเปิด popup
            markersLayer.eachLayer(layer => {
                if (layer.options && layer.options.studentName === studentName) {
                    layer.openPopup();
                }
            });
        }
    }
}

// View student details (enhanced version in other files)
function viewStudentDetails(studentName) {
    if (typeof showStudentDetailModal === 'function') {
        showStudentDetailModal(studentName);
    } else {
        // Basic fallback
        const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
        if (student) {
            alert(`รายละเอียดของ ${studentName}\nห้อง: ${student['ห้องเรียน']}\nสถานะ: ${student['สถานการณ์เยี่ยม']}`);
        }
    }
}

// Populate class filter
function populateClassFilter() {
    const classSelect = document.getElementById('classFilter');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">ทุกห้องเรียน</option>';
    
    const classes = [...new Set(homeVisitData.map(student => student['ห้องเรียน']).filter(Boolean))].sort();
    
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.text = className;
        classSelect.appendChild(option);
    });
}

// =================================================================
// LIFF Functions
// =================================================================

async function initializeLiff() {
    try {
        if (typeof liff === 'undefined') {
            console.warn('LIFF SDK not available');
            return;
        }
        
        await liff.init({ liffId: '2005494853-ZDznGqqe' });
        if (liff.isLoggedIn()) {
            displayUserInfo();
            const loginButton = document.getElementById('login-button');
            if (loginButton) {
                loginButton.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('LIFF initialization failed', error);
    }
}

async function displayUserInfo() {
    try {
        if (typeof liff === 'undefined' || !liff.isLoggedIn()) {
            console.warn('LIFF not available or not logged in');
            return;
        }
        
        const profile = await liff.getProfile();
        const profileNameElement = document.getElementById('profile-name');
        const profilePictureElement = document.getElementById('profile-picture');
        const logoutButton = document.getElementById('logout-button');
        const shareButton = document.getElementById('share-button');
        
        if (profileNameElement) profileNameElement.textContent = profile.displayName;
        if (profilePictureElement) {
            profilePictureElement.src = profile.pictureUrl;
            profilePictureElement.style.display = 'inline';
        }
        if (logoutButton) logoutButton.style.display = 'inline-block';
        if (shareButton) shareButton.style.display = 'inline-block';
    } catch (error) {
        console.error('Error getting profile:', error);
    }
}

function shareMapData() {
    if (typeof liff === 'undefined' || !liff.isLoggedIn()) {
        alert('กรุณาเข้าสู่ระบบก่อนแชร์ข้อมูล');
        return;
    }

    const visitedElement = document.getElementById('visitedCount');
    const notVisitedElement = document.getElementById('notVisitedCount');
    const totalElement = document.getElementById('totalStudents');
    const percentageElement = document.getElementById('visitPercentage');
    const classFilterElement = document.getElementById('classFilter');
    
    if (!visitedElement || !notVisitedElement || !totalElement || !percentageElement) {
        console.error('Required elements not found for sharing');
        return;
    }

    const visited = visitedElement.textContent;
    const notVisited = notVisitedElement.textContent;
    const total = totalElement.textContent;
    const percentage = percentageElement.textContent;
    const selectedClass = classFilterElement ? classFilterElement.value || 'ทุกห้องเรียน' : 'ทุกห้องเรียน';
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

    const profilePictureElement = document.getElementById('profile-picture');
    const profileNameElement = document.getElementById('profile-name');
    
    const profilePicture = profilePictureElement ? profilePictureElement.src : '';
    const profileName = profileNameElement ? profileNameElement.textContent : 'ผู้ใช้ระบบ';

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
                                        text: currentSemester || 'ไม่ระบุ',
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
                    profilePicture ? {
                        type: "image",
                        url: profilePicture,
                        size: "sm",
                        aspectMode: "cover",
                        aspectRatio: "1:1",
                        gravity: "bottom",
                        margin: "md"
                    } : null,
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
                ].filter(Boolean),
                spacing: "sm",
                paddingTop: "10px"
            }
        }
    };

    if (typeof liff !== 'undefined' && liff.shareTargetPicker) {
        liff.shareTargetPicker([flexMessage])
            .then(() => {
                console.log('Message shared successfully');
            })
            .catch(function (error) {
                console.error('Error sending message: ', error);
                alert('เกิดข้อผิดพลาดในการแชร์ข้อมูล');
            });
    } else {
        alert('ไม่สามารถแชร์ข้อมูลได้ในขณะนี้');
    }
}

function logout() {
    if (typeof liff !== 'undefined' && liff.logout) {
        liff.logout();
        window.location.reload();
    } else {
        console.warn('LIFF logout not available');
    }
}
// =================================================================
// Utility Functions
// =================================================================

function chatFunction() {
    window.open('https://line.me/R/ti/p/@747spikt', '_blank');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        const fullscreenButton = document.getElementById('fullscreenButton');
        if (fullscreenButton) {
            fullscreenButton.textContent = 'ย่อขนาดจอ';
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            const fullscreenButton = document.getElementById('fullscreenButton');
            if (fullscreenButton) {
                fullscreenButton.textContent = 'ขยายเต็มจอ';
            }
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
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = currentDateTime;
    }
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

// Create default footer if footer.html not found
function createDefaultFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        footerContainer.innerHTML = `
            <footer class="footer mt-5">
                <div class="container">
                    <div class="row">
                        <div class="col-md-6">
                            <h5>สารสนเทศเยี่ยมบ้านนักเรียน</h5>
                            <p>ระบบติดตามและจัดการข้อมูลการเยี่ยมบ้านนักเรียน</p>
                        </div>
                        <div class="col-md-6">
                            <h5>ติดต่อเรา</h5>
                            <ul class="list-unstyled">
                                <li><i class="fas fa-phone"></i> โทร: 032-123-456</li>
                                <li><i class="fas fa-envelope"></i> อีเมล: info@school.ac.th</li>
                                <li><i class="fas fa-map-marker-alt"></i> ที่อยู่: โรงเรียนตัวอย่าง</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
            <div class="footer-bottom">
                <div class="container">
                    <p class="mb-0">&copy; 2025 Student Care System. All rights reserved.</p>
                </div>
            </div>
        `;
    }
}

console.log('🗺️ Map Core System loaded successfully!');// =================================================================
// 🗺️ MAP CORE - ไฟล์ JavaScript หลักสำหรับแผนที่เยี่ยมบ้าน
// =================================================================

// Global variables
let map;
let homeVisitData = [];
let currentSemester = '';
let schoolMarker;
let markersLayer;
let currentFilters = {};
let clusterGroup;
let heatmapLayer;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    populateSemesterDropdown();
    
    // Initialize LIFF only if available
    if (typeof liff !== 'undefined') {
        initializeLiff();
    } else {
        console.warn('LIFF SDK not loaded');
    }
    
    setupEventListeners();
    loadFooter();
    
    // Initialize additional systems when they become available
    setTimeout(() => {
        if (typeof initializePriorityModal === 'function') {
            initializePriorityModal();
        }
        if (typeof loadStudentNotes === 'function') {
            loadStudentNotes();
        }
        if (typeof createNotificationBar === 'function') {
            createNotificationBar();
        }
        if (typeof requestNotificationPermission === 'function') {
            requestNotificationPermission();
        }
    }, 1000);
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Auto-check urgent cases every 5 minutes
    setInterval(() => {
        if (currentSemester && typeof checkUrgentCases === 'function' && typeof notificationSettings !== 'undefined' && notificationSettings?.autoCheck) {
            checkUrgentCases();
        }
    }, 300000);
    
    // Auto-refresh data every 5 minutes
    setInterval(() => {
        if (currentSemester) {
            loadMapData(currentSemester);
        }
    }, 300000);
});

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
        const coordsElement = document.getElementById('mouseCoords');
        if (coordsElement) {
            coordsElement.textContent = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        }
    });

    map.on('zoomend', function() {
        const zoomElement = document.getElementById('zoomLevel');
        if (zoomElement) {
            zoomElement.textContent = map.getZoom();
        }
    });

    map.on('click', function(e) {
        const mapInfoElement = document.getElementById('mapInfo');
        if (mapInfoElement) {
            mapInfoElement.style.display = 'block';
        }
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

        // Update UI components
        updateMapMarkers();
        updateStatistics();
        updateAdvancedStatistics();
        updateRecentActivities();
        updatePriorityCases();
        populateClassFilter();
        
        // Check for urgent cases (if available)
        setTimeout(() => {
            if (typeof checkUrgentCases === 'function') {
                checkUrgentCases();
            }
            if (typeof showNotificationBar === 'function') {
                showNotificationBar();
            }
        }, 500);
        
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
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = createStudentMarker(student, lat, lng);
                markersLayer.addLayer(marker);
            }
        }
    });
}

// Create marker for student
function createStudentMarker(student, lat, lng) {
    const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
    const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
    const hasWelfare = student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE';
    const isLowIncome = income > 0 && income < 10000;
    
    let markerColor = isVisited ? '#28a745' : '#dc3545';
    let borderColor = 'white';
    let markerSize = 15;
    
    // Special styling for urgent cases
    if (!isVisited && isLowIncome && hasWelfare) {
        borderColor = '#ffc107';
        markerSize = 18;
        markerColor = 'linear-gradient(45deg, #dc3545, #ffc107)';
    }
    
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'student-marker',
            html: `<div style="background: ${markerColor}; width: ${markerSize}px; height: ${markerSize}px; border-radius: 50%; border: 2px solid ${borderColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.3); ${!isVisited ? 'animation: pulse 2s infinite;' : ''}"></div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize/2, markerSize/2]
        }),
        type: 'student',
        studentName: student['ชื่อและนามสกุล']
    });

    const popupContent = createEnhancedPopupContent(student);
    
    marker.bindPopup(popupContent, {
        autoPan: true,
        autoPanPadding: [10, 10],
        autoPanPaddingTopLeft: [10, 10],
        autoPanPaddingBottomRight: [10, 10],
        keepInView: true,
        maxWidth: 300,
        maxHeight: 400,
        offset: [0, -10]
    });
    
    return marker;
}

