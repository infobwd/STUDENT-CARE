const visited = students.filter(s => s['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว').length;
        
        return {
            label: range.label,
            total: students.length,
            visited: visited,
            visitedPercent: students.length > 0 ? ((visited / students.length) * 100).toFixed(1) : 0
        };
    });
    
    return distanceStats;
}

// สถิติตามไทม์ไลน์
function generateTimelineStats() {
    const visitedStudents = homeVisitData
        .filter(student => student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว' && student['วันที่'])
        .map(student => {
            const visitDate = parseThaiDateFromCurrentDateTime ? 
                parseThaiDateFromCurrentDateTime(student['วันที่']) : new Date(student['วันที่']);
            return {
                ...student,
                visitDate: visitDate
            };
        })
        .filter(student => student.visitDate)
        .sort((a, b) => a.visitDate - b.visitDate);
    
    // จัดกลุ่มตามเดือน
    const monthlyStats = {};
    visitedStudents.forEach(student => {
        const monthKey = student.visitDate.toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long',
            timeZone: 'Asia/Bangkok'
        });
        
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = 0;
        }
        monthlyStats[monthKey]++;
    });
    
    return {
        monthly: monthlyStats,
        firstVisit: visitedStudents.length > 0 ? visitedStudents[0].visitDate : null,
        lastVisit: visitedStudents.length > 0 ? visitedStudents[visitedStudents.length - 1].visitDate : null,
        totalVisits: visitedStudents.length
    };
}

// แสดง Modal รายงานขั้นสูง
function showAdvancedReportModal(report) {
    const reportModalHTML = `
        <div class="modal fade" id="advancedReportModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-line"></i> รายงานสถิติขั้นสูง
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Overview Stats -->
                        <div class="row mb-4">
                            <div class="col-12">
                                <h6><i class="fas fa-chart-pie text-primary"></i> ภาพรวม</h6>
                                <div class="row">
                                    <div class="col-md-2">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h4 class="text-primary">${report.overview.total}</h4>
                                                <small>นักเรียนทั้งหมด</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-2">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h4 class="text-success">${report.overview.visitedPercent}%</h4>
                                                <small>เยี่ยมแล้ว</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-2">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h4 class="text-warning">${report.overview.welfarePercent}%</h4>
                                                <small>ได้สวัสดิการ</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h4 class="text-info">฿${parseInt(report.overview.avgIncome).toLocaleString()}</h4>
                                                <small>รายได้เฉลี่ย</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="card text-center">
                                            <div class="card-body">
                                                <h4 class="text-secondary">${Object.keys(report.byClass).length}</h4>
                                                <small>ห้องเรียน</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Class Stats -->
                        <div class="row mb-4">
                            <div class="col-12">
                                <h6><i class="fas fa-school text-success"></i> สถิติตามห้องเรียน</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>ห้องเรียน</th>
                                                <th>จำนวนนักเรียน</th>
                                                <th>เยี่ยมแล้ว</th>
                                                <th>% เยี่ยม</th>
                                                <th>ได้สวัสดิการ</th>
                                                <th>รายได้เฉลี่ย</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${Object.keys(report.byClass).map(className => {
                                                const stats = report.byClass[className];
                                                return `
                                                    <tr>
                                                        <td><strong>${className}</strong></td>
                                                        <td>${stats.total}</td>
                                                        <td>${stats.visited}</td>
                                                        <td><span class="badge ${stats.visitedPercent >= 80 ? 'bg-success' : stats.visitedPercent >= 50 ? 'bg-warning' : 'bg-danger'}">${stats.visitedPercent}%</span></td>
                                                        <td>${stats.welfare}</td>
                                                        <td>฿${parseInt(stats.avgIncome).toLocaleString()}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Income & Distance Stats -->
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="fas fa-money-bill text-warning"></i> สถิติตามรายได้</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead class="table-light">
                                            <tr>
                                                <th>ช่วงรายได้</th>
                                                <th>จำนวน</th>
                                                <th>% เยี่ยม</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${report.byIncome.map(stat => `
                                                <tr>
                                                    <td>${stat.label}</td>
                                                    <td>${stat.total}</td>
                                                    <td><span class="badge ${stat.visitedPercent >= 70 ? 'bg-success' : 'bg-warning'}">${stat.visitedPercent}%</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="fas fa-map-marker-alt text-danger"></i> สถิติตามระยะทาง</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead class="table-light">
                                            <tr>
                                                <th>ระยะทาง</th>
                                                <th>จำนวน</th>
                                                <th>% เยี่ยม</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${report.byDistance.map(stat => `
                                                <tr>
                                                    <td>${stat.label}</td>
                                                    <td>${stat.total}</td>
                                                    <td><span class="badge ${stat.visitedPercent >= 70 ? 'bg-success' : 'bg-warning'}">${stat.visitedPercent}%</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Timeline -->
                        ${Object.keys(report.timeline.monthly).length > 0 ? `
                        <div class="row mt-4">
                            <div class="col-12">
                                <h6><i class="fas fa-calendar text-info"></i> ไทม์ไลน์การเยี่ยมบ้าน</h6>
                                <div class="alert alert-info">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <strong>เริ่มเยี่ยมครั้งแรก:</strong><br>
                                            <small>${report.timeline.firstVisit ? report.timeline.firstVisit.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }) : 'ไม่มีข้อมูล'}</small>
                                        </div>
                                        <div class="col-md-4">
                                            <strong>เยี่ยมครั้งล่าสุด:</strong><br>
                                            <small>${report.timeline.lastVisit ? report.timeline.lastVisit.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }) : 'ไม่มีข้อมูล'}</small>
                                        </div>
                                        <div class="col-md-4">
                                            <strong>รวมการเยี่ยม:</strong><br>
                                            <small>${report.timeline.totalVisits} ครั้ง</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    ${Object.keys(report.timeline.monthly).map(month => `
                                        <div class="col-md-3 mb-2">
                                            <div class="card">
                                                <div class="card-body text-center">
                                                    <h6>${month}</h6>
                                                    <h4 class="text-primary">${report.timeline.monthly[month]}</h4>
                                                    <small>ครั้ง</small>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-success" onclick="exportAdvancedReport()">
                            <i class="fas fa-download"></i> ส่งออกรายงาน
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('advancedReportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', reportModalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('advancedReportModal'));
    modal.show();
}

// ส่งออกรายงานขั้นสูง
function exportAdvancedReport() {
    const report = {
        overview: generateOverviewStats(),
        byClass: generateClassStats(),
        byIncome: generateIncomeStats(),
        byDistance: generateDistanceStats(),
        timeline: generateTimelineStats()
    };
    
    // สร้าง CSV content
    let csvContent = '# รายงานสถิติขั้นสูง\n';
    csvContent += `# สร้างเมื่อ: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n`;
    csvContent += `# ภาคเรียน: ${currentSemester}\n\n`;
    
    // ภาพรวม
    csvContent += '## ภาพรวม\n';
    csvContent += 'รายการ,จำนวน,เปอร์เซ็นต์\n';
    csvContent += `นักเรียนทั้งหมด,${report.overview.total},-\n`;
    csvContent += `เยี่ยมแล้ว,${report.overview.visited},${report.overview.visitedPercent}%\n`;
    csvContent += `ได้สวัสดิการ,${report.overview.withWelfare},${report.overview.welfarePercent}%\n`;
    csvContent += `รายได้เฉลี่ย,${report.overview.avgIncome} บาท,-\n\n`;
    
    // สถิติตามห้องเรียน
    csvContent += '## สถิติตามห้องเรียน\n';
    csvContent += 'ห้องเรียน,จำนวนนักเรียน,เยี่ยมแล้ว,เปอร์เซ็นต์เยี่ยม,ได้สวัสดิการ,รายได้เฉลี่ย\n';
    Object.keys(report.byClass).forEach(className => {
        const stats = report.byClass[className];
        csvContent += `${className},${stats.total},${stats.visited},${stats.visitedPercent}%,${stats.welfare},${stats.avgIncome}\n`;
    });
    csvContent += '\n';
    
    // สถิติตามรายได้
    csvContent += '## สถิติตามรายได้\n';
    csvContent += 'ช่วงรายได้,จำนวน,เยี่ยมแล้ว,เปอร์เซ็นต์เยี่ยม\n';
    report.byIncome.forEach(stat => {
        csvContent += `${stat.label},${stat.total},${stat.visited},${stat.visitedPercent}%\n`;
    });
    csvContent += '\n';
    
    // สถิติตามระยะทาง
    csvContent += '## สถิติตามระยะทาง\n';
    csvContent += 'ระยะทาง,จำนวน,เยี่ยมแล้ว,เปอร์เซ็นต์เยี่ยม\n';
    report.byDistance.forEach(stat => {
        csvContent += `${stat.label},${stat.total},${stat.visited},${stat.visitedPercent}%\n`;
    });
    
    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานสถิติขั้นสูง_${new Date().toLocaleDateString('th-TH')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (typeof showToast === 'function') {
        showToast('ส่งออกรายงานสำเร็จ', 'success');
    }
}

// =================================================================
// 🔍 Advanced Search System
// =================================================================

// ค้นหาข้อมูลขั้นสูง
function showAdvancedSearchModal() {
    const searchModalHTML = `
        <div class="modal fade" id="advancedSearchModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-search"></i> ค้นหาขั้นสูง
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="advancedSearchForm">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">ชื่อ-นามสกุล:</label>
                                    <input type="text" id="searchName" class="form-control" placeholder="ค้นหาชื่อหรือนามสกุล">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">ชื่อเล่น:</label>
                                    <input type="text" id="searchNickname" class="form-control" placeholder="ค้นหาชื่อเล่น">
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label class="form-label">ห้องเรียน:</label>
                                    <select id="searchClass" class="form-select">
                                        <option value="">ทุกห้อง</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">สถานะการเยี่ยม:</label>
                                    <select id="searchVisitStatus" class="form-select">
                                        <option value="">ทั้งหมด</option>
                                        <option value="เยี่ยมแล้ว">เยี่ยมแล้ว</option>
                                        <option value="ยังไม่เยี่ยม">ยังไม่เยี่ยม</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">สวัสดิการ:</label>
                                    <select id="searchWelfare" class="form-select">
                                        <option value="">ทั้งหมด</option>
                                        <option value="TRUE">ได้รับ</option>
                                        <option value="FALSE">ไม่ได้รับ</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">รายได้ (บาท):</label>
                                    <div class="input-group">
                                        <input type="number" id="searchIncomeMin" class="form-control" placeholder="ต่ำสุด">
                                        <span class="input-group-text">ถึง</span>
                                        <input type="number" id="searchIncomeMax" class="form-control" placeholder="สูงสุด">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">ระยะทาง (กม.):</label>
                                    <div class="input-group">
                                        <input type="number" id="searchDistanceMin" class="form-control" placeholder="ใกล้สุด" step="0.1">
                                        <span class="input-group-text">ถึง</span>
                                        <input type="number" id="searchDistanceMax" class="form-control" placeholder="ไกลสุด" step="0.1">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <label class="form-label">อาชีพผู้ปกครอง:</label>
                                    <input type="text" id="searchOccupation" class="form-control" placeholder="ค้นหาอาชีพ">
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <label class="form-label">ภาระพึ่งพิง:</label>
                                    <input type="text" id="searchDependency" class="form-control" placeholder="ค้นหาภาระพึ่งพิง">
                                </div>
                            </div>
                        </form>
                        
                        <div class="alert alert-info">
                            <small><i class="fas fa-info-circle"></i> เว้นว่างช่องที่ไม่ต้องการค้นหา ระบบจะค้นหาเฉพาะช่องที่กรอกข้อมูล</small>
                        </div>
                        
                        <!-- Search Results -->
                        <div id="searchResults" style="display: none;">
                            <hr>
                            <h6>ผลการค้นหา (<span id="searchResultsCount">0</span> รายการ)</h6>
                            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm table-hover">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>ชื่อ-นามสกุล</th>
                                            <th>ห้อง</th>
                                            <th>สถานะ</th>
                                            <th>รายได้</th>
                                            <th>การดำเนินการ</th>
                                        </tr>
                                    </thead>
                                    <tbody id="searchResultsBody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="clearAdvancedSearch()">
                            <i class="fas fa-times"></i> ล้าง
                        </button>
                        <button type="button" class="btn btn-success" onclick="performAdvancedSearch()">
                            <i class="fas fa-search"></i> ค้นหา
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('advancedSearchModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', searchModalHTML);
    
    // Populate class options
    populateAdvancedSearchClasses();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('advancedSearchModal'));
    modal.show();
}

// Populate class options for advanced search
function populateAdvancedSearchClasses() {
    const classSelect = document.getElementById('searchClass');
    if (!classSelect || !homeVisitData) return;
    
    const classes = [...new Set(homeVisitData.map(student => student['ห้องเรียน']).filter(Boolean))].sort();
    
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.text = className;
        classSelect.appendChild(option);
    });
}

// ทำการค้นหาขั้นสูง
function performAdvancedSearch() {
    if (!homeVisitData || homeVisitData.length === 0) {
        if (typeof showToast === 'function') {
            showToast('ไม่มีข้อมูลสำหรับค้นหา', 'warning');
        }
        return;
    }
    
    const criteria = {
        name: document.getElementById('searchName')?.value.toLowerCase().trim(),
        nickname: document.getElementById('searchNickname')?.value.toLowerCase().trim(),
        class: document.getElementById('searchClass')?.value,
        visitStatus: document.getElementById('searchVisitStatus')?.value,
        welfare: document.getElementById('searchWelfare')?.value,
        incomeMin: parseFloat(document.getElementById('searchIncomeMin')?.value) || 0,
        incomeMax: parseFloat(document.getElementById('searchIncomeMax')?.value) || Infinity,
        distanceMin: parseFloat(document.getElementById('searchDistanceMin')?.value) || 0,
        distanceMax: parseFloat(document.getElementById('searchDistanceMax')?.value) || Infinity,
        occupation: document.getElementById('searchOccupation')?.value.toLowerCase().trim(),
        dependency: document.getElementById('searchDependency')?.value.toLowerCase().trim()
    };
    
    const results = homeVisitData.filter(student => {
        // ชื่อ-นามสกุล
        if (criteria.name && !(student['ชื่อและนามสกุล'] || '').toLowerCase().includes(criteria.name)) {
            return false;
        }
        
        // ชื่อเล่น
        if (criteria.nickname && !(student['ชื่อเล่น'] || '').toLowerCase().includes(criteria.nickname)) {
            return false;
        }
        
        // ห้องเรียน
        if (criteria.class && student['ห้องเรียน'] !== criteria.class) {
            return false;
        }
        
        // สถานะการเยี่ยม
        if (criteria.visitStatus) {
            const isVisited = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว';
            if (criteria.visitStatus === 'เยี่ยมแล้ว' && !isVisited) return false;
            if (criteria.visitStatus === 'ยังไม่เยี่ยม' && isVisited) return false;
        }
        
        // สวัสดิการ
        if (criteria.welfare && student['ได้สวัสดิการแห่งรัฐ'] !== criteria.welfare) {
            return false;
        }
        
        // รายได้
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income < criteria.incomeMin || income > criteria.incomeMax) {
            return false;
        }
        
        // ระยะทาง
        const distance = student.distanceFromSchool || 0;
        if (distance < criteria.distanceMin || distance > criteria.distanceMax) {
            return false;
        }
        
        // อาชีพ
        if (criteria.occupation && !(student['อาชีพผู้ปกครอง'] || '').toLowerCase().includes(criteria.occupation)) {
            return false;
        }
        
        // ภาระพึ่งพิง
        if (criteria.dependency && !(student['ครัวเรือนมีภาระพึ่งพิง'] || '').toLowerCase().includes(criteria.dependency)) {
            return false;
        }
        
        return true;
    });
    
    displayAdvancedSearchResults(results);
}

// แสดงผลการค้นหา
function displayAdvancedSearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('searchResultsCount');
    const resultsBody = document.getElementById('searchResultsBody');
    
    if (!resultsContainer || !resultsCount || !resultsBody) return;
    
    resultsCount.textContent = results.length;
    resultsContainer.style.display = 'block';
    
    if (results.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</td></tr>';
        return;
    }
    
    const rows = results.map(student => {
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')).toLocaleString() : 'ไม่ระบุ';
        const visitStatus = student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว' ? 
            '<span class="badge bg-success">เยี่ยมแล้ว</span>' : 
            '<span class="badge bg-danger">ยังไม่เยี่ยม</span>';
        
        return `
            <tr>
                <td><strong>${student['ชื่อและนามสกุล'] || 'ไม่ระบุ'}</strong><br><small class="text-muted">${student['ชื่อเล่น'] || ''}</small></td>
                <td>${student['ห้องเรียน'] || 'ไม่ระบุ'}</td>
                <td>${visitStatus}</td>
                <td>฿${income}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="focusOnStudentFromSearch('${student['ชื่อและนามสกุล']}')" title="ดูบนแผนที่">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="viewStudentDetails('${student['ชื่อและนามสกุล']}')" title="รายละเอียด">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    resultsBody.innerHTML = rows;
}

// Focus ไปที่นักเรียนจากการค้นหา
function focusOnStudentFromSearch(studentName) {
    // ปิด modal ค้นหา
    const modal = bootstrap.Modal.getInstance(document.getElementById('advancedSearchModal'));
    if (modal) modal.hide();
    
    // Focus ไปที่แผนที่
    if (typeof focusOnStudentMap === 'function') {
        focusOnStudentMap(studentName);
    }
}

// ล้างการค้นหา
function clearAdvancedSearch() {
    const inputs = ['searchName', 'searchNickname', 'searchIncomeMin', 'searchIncomeMax', 
                    'searchDistanceMin', 'searchDistanceMax', 'searchOccupation', 'searchDependency'];
    const selects = ['searchClass', 'searchVisitStatus', 'searchWelfare'];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    selects.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    // ซ่อนผลการค้นหา
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

// =================================================================
// 📱 PWA Features
// =================================================================

// ตรวจสอบการรองรับ PWA
function checkPWASupport() {
    if ('serviceWorker' in navigator) {
        console.log('PWA supported');
        // สามารถเพิ่มการลงทะเบียน Service Worker ได้ที่นี่
    }
    
    // ตรวจสอบการติดตั้ง PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
}

// แสดงปุ่มติดตั้งแอป
function showInstallButton() {
    // สร้างปุ่มติดตั้งแอป
    const installButton = document.createElement('button');
    installButton.innerHTML = '<i class="fas fa-download"></i> ติดตั้งแอป';
    installButton.className = 'btn btn-primary btn-sm';
    installButton.style.position = 'fixed';
    installButton.style.bottom = '20px';
    installButton.style.left = '20px';
    installButton.style.zIndex = '1000';
    
    installButton.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                installButton.remove();
            });
        }
    });
    
    document.body.appendChild(installButton);
    
    // ซ่อนปุ่มหลัง 10 วินาที
    setTimeout(() => {
        if (installButton && installButton.parentNode) {
            installButton.remove();
        }
    }, 10000);
}

// =================================================================
// 🔧 Performance Optimization
// =================================================================

// ปรับปรุงประสิทธิภาพ
function optimizePerformance() {
    // Lazy loading สำหรับ marker ที่อยู่นอกหน้าจอ
    if (map && markersLayer) {
        const bounds = map.getBounds();
        markersLayer.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                const position = layer.getLatLng();
                if (!bounds.contains(position)) {
                    // ซ่อน marker ที่อยู่นอกหน้าจอ
                    layer.setOpacity(0.3);
                } else {
                    layer.setOpacity(1);
                }
            }
        });
    }
    
    // ล้างข้อมูลที่ไม่จำเป็น
    clearUnusedData();
}

// ล้างข้อมูลที่ไม่จำเป็น
function clearUnusedData() {
    // ล้าง cache ที่เก่า
    const cacheKeys = Object.keys(localStorage);
    cacheKeys.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('temp_')) {
            const item = localStorage.getItem(key);
            try {
                const data = JSON.parse(item);
                const age = Date.now() - new Date(data.timestamp).getTime();
                if (age > 24 * 60 * 60 * 1000) { // 24 ชั่วโมง
                    localStorage.removeItem(key);
                }
            } catch (error) {
                localStorage.removeItem(key);
            }
        }
    });
}

// =================================================================
// 🎯 Keyboard Shortcuts
// =================================================================

// เพิ่ม keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + F - เปิดการค้นหาขั้นสูง
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            showAdvancedSearchModal();
        }
        
        // Ctrl + R - รีเฟรชข้อมูล
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (currentSemester && typeof loadMapData === 'function') {
                loadMapData(currentSemester);
            }
        }
        
        // Ctrl + S - บันทึก session
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveUserSession();
            if (typeof showToast === 'function') {
                showToast('บันทึก session สำเร็จ', 'success');
            }
        }
        
        // Escape - ปิด modal ที่เปิดอยู่
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            if (openModals.length > 0) {
                const lastModal = openModals[openModals.length - 1];
                const modal = bootstrap.Modal.getInstance(lastModal);
                if (modal) modal.hide();
            }
        }
        
        // F11 - Toggle fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            if (typeof toggleFullscreen === 'function') {
                toggleFullscreen();
            }
        }
    });
}

// =================================================================
// 🌐 Multi-language Support (Basic)
// =================================================================

// ภาษาหลายภาษา (พื้นฐาน)
const translations = {
    th: {
        'visited': 'เยี่ยมแล้ว',
        'not_visited': 'ยังไม่เยี่ยม',
        'school': 'โรงเรียน',
        'student': 'นักเรียน',
        'class': 'ห้องเรียน',
        'income': 'รายได้',
        'welfare': 'สวัสดิการ',
        'search': 'ค้นหา',
        'export': 'ส่งออก',
        'close': 'ปิด'
    },
    en: {
        'visited': 'Visited',
        'not_visited': 'Not Visited',
        'school': 'School',
        'student': 'Student',
        'class': 'Class',
        'income': 'Income',
        'welfare': 'Welfare',
        'search': 'Search',
        'export': 'Export',
        'close': 'Close'
    }
};

let currentLanguage = 'th';

// เปลี่ยนภาษา
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    // อัปเดต UI ตามภาษาที่เลือก
    updateUILanguage();
}

// อัปเดต UI ตามภาษา
function updateUILanguage() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// =================================================================
// 🚀 Initialization
// =================================================================

// เริ่มต้นระบบฟีเจอร์เสริม
function initializeFeatures() {
    // โหลดการตั้งค่า
    loadUserSession();
    loadMapTheme();
    
    // เปิดใช้งานการบันทึกอัตโนมัติ
    enableAutoSave();
    
    // ตั้งค่า keyboard shortcuts
    setupKeyboardShortcuts();
    
    // ตรวจสอบ PWA
    checkPWASupport();
    
    // อัปเดตสภาพอากาศ
    updateWeatherInfo();
    setInterval(updateWeatherInfo, 600000); // อัปเดตทุก 10 นาที
    
    // ปรับปรุงประสิทธิภาพ
    if (map) {
        map.on('moveend', optimizePerformance);
        map.on('zoomend', optimizePerformance);
    }
    
    // โหลดภาษา
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        changeLanguage(savedLanguage);
    }
    
    console.log('🌟 Advanced Features initialized successfully!');
}

// เพิ่มปุ่มฟีเจอร์เสริมใน UI
function addFeatureButtons() {
    // เพิ่มปุ่มในเมนู dropdown
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
        const featureItems = `
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="showAdvancedSearchModal()">
                <i class="fas fa-search"></i> ค้นหาขั้นสูง
            </a></li>
            <li><a class="dropdown-item" href="#" onclick="generateAdvancedReport()">
                <i class="fas fa-chart-line"></i> รายงานขั้นสูง
            </a></li>
            <li><a class="dropdown-item" href="#" onclick="changeMapTheme('satellite')">
                <i class="fas fa-satellite"></i> แผนที่ดาวเทียม
            </a></li>
            <li><a class="dropdown-item" href="#" onclick="changeMapTheme('default')">
                <i class="fas fa-map"></i> แผนที่ปกติ
            </a></li>
        `;
        dropdown.insertAdjacentHTML('beforeend', featureItems);
    }
    
    // เพิ่มปุ่มลัดในแถบควบคุมแผนที่
    const mapControls = document.querySelector('.row.mb-3 .btn-group');
    if (mapControls) {
        const additionalButtons = `
            <button class="btn btn-outline-info btn-sm" onclick="showAdvancedSearchModal()" title="ค้นหาขั้นสูง">
                <i class="fas fa-search"></i> ค้นหา
            </button>
            <button class="btn btn-outline-warning btn-sm" onclick="generateAdvancedReport()" title="รายงานขั้นสูง">
                <i class="fas fa-chart-line"></i> รายงาน
            </button>
        `;
        mapControls.insertAdjacentHTML('beforeend', additionalButtons);
    }
}

// =================================================================
// 📊 System Health Check
// =================================================================

// ตรวจสอบสุขภาพระบบ
function performSystemHealthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        data: {
            homeVisitData: homeVisitData ? homeVisitData.length : 0,
            currentSemester: currentSemester || 'ไม่ได้ตั้งค่า',
            mapStatus: map ? 'ปกติ' : 'ไม่พร้อมใช้งาน',
            notificationSettings: notificationSettings.enabled ? 'เปิด' : 'ปิด',
            notesCount: Object.keys(studentNotes || {}).length,
            urgentCasesCount: urgentCases ? urgentCases.length : 0
        },
        performance: {
            memoryUsage: navigator.deviceMemory || 'ไม่ทราบ',
            connection: navigator.connection ? navigator.connection.effectiveType : 'ไม่ทราบ',
            online: navigator.onLine
        },
        storage: {
            localStorage: getLocalStorageUsage(),
            sessionStorage: getSessionStorageUsage()
        }
    };
    
    console.log('System Health Check:', health);
    return health;
}

// ดูการใช้งาน localStorage
function getLocalStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage.getItem(key).length;
        }
    }
    return `${(total / 1024).toFixed(2)} KB`;
}

// ดูการใช้งาน sessionStorage
function getSessionStorageUsage() {
    let total = 0;
    for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
            total += sessionStorage.getItem(key).length;
        }
    }
    return `${(total / 1024).toFixed(2)} KB`;
}

// =================================================================
// 🎮 Easter Eggs & Fun Features
// =================================================================

// Konami Code Easter Egg
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

function setupKonamiCode() {
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
            activateEasterEgg();
            konamiCode = [];
        }
    });
}

// เปิดใช้งาน Easter Egg
function activateEasterEgg() {
    if (typeof showToast === 'function') {
        showToast('🎉 Konami Code Activated! Developer Mode Unlocked!', 'success');
    }
    
    // เปิดใช้งานฟีเจอร์พิเศษ
    const devButton = document.createElement('button');
    devButton.innerHTML = '<i class="fas fa-code"></i> Dev Tools';
    devButton.className = 'btn btn-warning btn-sm';
    devButton.style.position = 'fixed';
    devButton.style.top = '120px';
    devButton.style.right = '20px';
    devButton.style.zIndex = '9999';
    devButton.onclick = () => {
        const health = performSystemHealthCheck();
        console.table(health.data);
        console.table(health.performance);
        console.table(health.storage);
        alert('Check console for system health data!');
    };
    
    document.body.appendChild(devButton);
    
    // เอฟเฟค confetti
    if (typeof createConfetti !== 'undefined') {
        createConfetti();
    }
}

// =================================================================
// 🔄 Auto-Update System
// =================================================================

// ตรวจสอบการอัปเดต
function checkForUpdates() {
    // ในระบบจริงจะตรวจสอบ version จาก server
    const currentVersion = '1.0.0';
    const lastUpdateCheck = localStorage.getItem('lastUpdateCheck');
    const now = new Date().getTime();
    
    // ตรวจสอบทุก 24 ชั่วโมง
    if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) > 86400000) {
        localStorage.setItem('lastUpdateCheck', now.toString());
        
        // จำลองการตรวจสอบอัปเดต
        setTimeout(() => {
            // สามารถเพิ่มการตรวจสอบ version จริงได้ที่นี่
            console.log('Update check completed - no updates available');
        }, 2000);
    }
}

// =================================================================
// 📱 Mobile Optimizations
// =================================================================

// ปรับปรุงสำหรับมือถือ
function optimizeForMobile() {
    // ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // ปรับขนาด marker ให้เหมาะกับหน้าจอเล็ก
        if (typeof adjustMarkerSizeForMobile === 'function') {
            adjustMarkerSizeForMobile();
        }
        
        // ปรับ popup ให้เหมาะกับมือถือ
        if (map) {
            map.options.maxZoom = 18;
            map.options.minZoom = 10;
        }
        
        // เพิ่ม touch gestures
        setupTouchGestures();
    }
}

// ตั้งค่า touch gestures
function setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe gestures
        if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
            if (deltaX > 0) {
                // Swipe right - เปิด sidebar
                console.log('Swipe right detected');
            } else {
                // Swipe left - ปิด sidebar
                console.log('Swipe left detected');
            }
        }
    });
}

// =================================================================
// 🚀 Final Initialization
// =================================================================

// เริ่มต้นระบบทั้งหมด
document.addEventListener('DOMContentLoaded', function() {
    // รอให้ระบบหลักโหลดเสร็จก่อน
    setTimeout(() => {
        initializeFeatures();
        addFeatureButtons();
        setupKonamiCode();
        checkForUpdates();
        optimizeForMobile();
        
        // ตรวจสอบสุขภาพระบบหลังจากโหลดเสร็จ
        setTimeout(performSystemHealthCheck, 3000);
    }, 2000);
});

// เมื่อหน้าต่างปิด - บันทึกข้อมูล
window.addEventListener('beforeunload', () => {
    saveUserSession();
    disableAutoSave();
});

// ตรวจสอบการเปลี่ยนแปลงขนาดหน้าจอ
window.addEventListener('resize', () => {
    optimizeForMobile();
    if (typeof optimizePerformance === 'function') {
        optimizePerformance();
    }
});

console.log('🌟 Map Features & Advanced Systems loaded successfully!');// =================================================================
// 🌟 MAP FEATURES - ฟีเจอร์เสริมและการขยายระบบ
// =================================================================

// Global variables for additional features
let weatherData = null;
let mapTheme = 'default';
let autoSaveInterval = null;

// =================================================================
// 🌤️ Weather Information System
// =================================================================

// แสดงข้อมูลสภาพอากาศ (จำลอง)
function updateWeatherInfo() {
    const weatherContainer = document.getElementById('weatherInfo');
    if (!weatherContainer) return;
    
    // จำลองข้อมูลสภาพอากาศ
    const weatherConditions = [
        { icon: 'fa-sun', text: 'แสงแดดดี', color: '#ffc107', suitable: true },
        { icon: 'fa-cloud-sun', text: 'มีเมฆบางส่วน', color: '#6c757d', suitable: true },
        { icon: 'fa-cloud-rain', text: 'ฝนเล็กน้อย', color: '#007bff', suitable: false },
        { icon: 'fa-cloud-rain', text: 'ฝนหนาแน่น', color: '#dc3545', suitable: false }
    ];
    
    // สุ่มสภาพอากาศ (ในระบบจริงจะดึงจาก API)
    const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    weatherContainer.innerHTML = `
        <div class="text-center">
            <i class="fas ${currentWeather.icon} fa-2x mb-2" style="color: ${currentWeather.color};"></i>
            <div><strong>${currentWeather.text}</strong></div>
            <small class="${currentWeather.suitable ? 'text-success' : 'text-warning'}">
                ${currentWeather.suitable ? 'เหมาะสำหรับการเยี่ยมบ้าน' : 'ควรระวังในการเยี่ยมบ้าน'}
            </small>
        </div>
    `;
}

// =================================================================
// 🎨 Map Theme System
// =================================================================

// เปลี่ยนธีมแผนที่
function changeMapTheme(theme) {
    if (!map) return;
    
    // ลบ tile layer เดิม
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    let tileUrl = '';
    let attribution = '© OpenStreetMap contributors';
    
    switch(theme) {
        case 'satellite':
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            attribution = '© Esri';
            break;
        case 'dark':
            tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            attribution = '© OpenStreetMap contributors © CARTO';
            break;
        case 'light':
            tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            attribution = '© OpenStreetMap contributors © CARTO';
            break;
        default:
            tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    
    L.tileLayer(tileUrl, { attribution }).addTo(map);
    mapTheme = theme;
    
    // บันทึกการตั้งค่า
    localStorage.setItem('mapTheme', theme);
    
    if (typeof showToast === 'function') {
        showToast(`เปลี่ยนธีมแผนที่เป็น ${theme}`, 'info');
    }
}

// โหลดธีมแผนที่จาก localStorage
function loadMapTheme() {
    const savedTheme = localStorage.getItem('mapTheme');
    if (savedTheme && savedTheme !== 'default') {
        setTimeout(() => changeMapTheme(savedTheme), 1000);
    }
}

// =================================================================
// 💾 Auto Save System
// =================================================================

// เปิดใช้งานการบันทึกอัตโนมัติ
function enableAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(() => {
        saveUserSession();
    }, 30000); // บันทึกทุก 30 วินาที
    
    console.log('Auto-save enabled');
}

// ปิดการบันทึกอัตโนมัติ
function disableAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
    
    console.log('Auto-save disabled');
}

// บันทึก session ของผู้ใช้
function saveUserSession() {
    try {
        const sessionData = {
            currentSemester: currentSemester,
            mapCenter: map ? [map.getCenter().lat, map.getCenter().lng] : null,
            mapZoom: map ? map.getZoom() : null,
            activeFilters: getCurrentFilters(),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('userSession', JSON.stringify(sessionData));
    } catch (error) {
        console.error('Error saving user session:', error);
    }
}

// โหลด session ของผู้ใช้
function loadUserSession() {
    try {
        const saved = localStorage.getItem('userSession');
        if (saved) {
            const sessionData = JSON.parse(saved);
            
            // โหลดการตั้งค่าต่างๆ
            if (sessionData.currentSemester && currentSemester !== sessionData.currentSemester) {
                const semesterDropdown = document.getElementById('semesterDropdown');
                if (semesterDropdown) {
                    semesterDropdown.value = sessionData.currentSemester;
                    // Trigger change event จะเกิดขึ้นจากระบบหลัก
                }
            }
            
            // โหลดตำแหน่งแผนที่
            if (sessionData.mapCenter && sessionData.mapZoom && map) {
                setTimeout(() => {
                    map.setView(sessionData.mapCenter, sessionData.mapZoom);
                }, 2000);
            }
            
            // โหลดตัวกรอง
            if (sessionData.activeFilters) {
                setTimeout(() => {
                    restoreFilters(sessionData.activeFilters);
                }, 1500);
            }
        }
    } catch (error) {
        console.error('Error loading user session:', error);
    }
}

// ดึงตัวกรองปัจจุบัน
function getCurrentFilters() {
    const filters = {};
    const filterIds = ['classFilter', 'visitStatusFilter', 'incomeFilter', 'welfareFilter', 'distanceFilter'];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            filters[id] = element.value;
        }
    });
    
    return filters;
}

// คืนค่าตัวกรอง
function restoreFilters(filters) {
    Object.keys(filters).forEach(id => {
        const element = document.getElementById(id);
        if (element && filters[id]) {
            element.value = filters[id];
        }
    });
    
    // Trigger filter update
    if (typeof updateMapWithAllFilters === 'function') {
        updateMapWithAllFilters();
    }
}

// =================================================================
// 📊 Advanced Statistics & Reports
// =================================================================

// สร้างรายงานสถิติขั้นสูง
function generateAdvancedReport() {
    if (!homeVisitData || homeVisitData.length === 0) {
        if (typeof showToast === 'function') {
            showToast('ไม่มีข้อมูลสำหรับสร้างรายงาน', 'warning');
        }
        return;
    }
    
    const report = {
        overview: generateOverviewStats(),
        byClass: generateClassStats(),
        byIncome: generateIncomeStats(),
        byDistance: generateDistanceStats(),
        timeline: generateTimelineStats()
    };
    
    showAdvancedReportModal(report);
}

// สถิติภาพรวม
function generateOverviewStats() {
    const total = homeVisitData.length;
    const visited = homeVisitData.filter(s => s['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว').length;
    const withWelfare = homeVisitData.filter(s => s['ได้สวัสดิการแห่งรัฐ'] === 'TRUE').length;
    
    const incomes = homeVisitData
        .map(s => s['รายได้'] ? parseFloat(s['รายได้'].replace(/[฿,]/g, '')) : 0)
        .filter(income => income > 0);
    
    const avgIncome = incomes.length > 0 ? 
        incomes.reduce((sum, income) => sum + income, 0) / incomes.length : 0;
    
    return {
        total,
        visited,
        visitedPercent: ((visited / total) * 100).toFixed(1),
        withWelfare,
        welfarePercent: ((withWelfare / total) * 100).toFixed(1),
        avgIncome: avgIncome.toFixed(0)
    };
}

// สถิติตามห้องเรียน
function generateClassStats() {
    const classStats = {};
    
    homeVisitData.forEach(student => {
        const className = student['ห้องเรียน'] || 'ไม่ระบุ';
        if (!classStats[className]) {
            classStats[className] = { total: 0, visited: 0, welfare: 0, totalIncome: 0, count: 0 };
        }
        
        classStats[className].total++;
        if (student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว') {
            classStats[className].visited++;
        }
        if (student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE') {
            classStats[className].welfare++;
        }
        
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0) {
            classStats[className].totalIncome += income;
            classStats[className].count++;
        }
    });
    
    // คำนวณเปอร์เซ็นต์และค่าเฉลี่ย
    Object.keys(classStats).forEach(className => {
        const stats = classStats[className];
        stats.visitedPercent = ((stats.visited / stats.total) * 100).toFixed(1);
        stats.welfarePercent = ((stats.welfare / stats.total) * 100).toFixed(1);
        stats.avgIncome = stats.count > 0 ? (stats.totalIncome / stats.count).toFixed(0) : 0;
    });
    
    return classStats;
}

// สถิติตามรายได้
function generateIncomeStats() {
    const ranges = [
        { min: 0, max: 5000, label: 'ต่ำกว่า 5,000' },
        { min: 5000, max: 10000, label: '5,000-10,000' },
        { min: 10000, max: 20000, label: '10,000-20,000' },
        { min: 20000, max: Infinity, label: 'มากกว่า 20,000' }
    ];
    
    const incomeStats = ranges.map(range => {
        const students = homeVisitData.filter(student => {
            const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
            return income >= range.min && income < range.max;
        });
        
        const visited = students.filter(s => s['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว').length;
        
        return {
            label: range.label,
            total: students.length,
            visited: visited,
            visitedPercent: students.length > 0 ? ((visited / students.length) * 100).toFixed(1) : 0
        };
    });
    
    return incomeStats;
}

