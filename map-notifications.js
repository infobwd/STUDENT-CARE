showToast(`เลื่อนการแจ้งเตือนไป ${minutes} นาที`, 'info');
}

// ปิดการแจ้งเตือน
function dismissUrgentAlert() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('urgentAlertModal'));
    if (modal) modal.hide();
    
    showToast('รับทราบการแจ้งเตือนแล้ว', 'success');
}

// อัปเดตแสดงผลเคสด่วนใน sidebar
function updateUrgentCasesDisplay() {
    const urgentContainer = document.getElementById('urgentCases');
    if (!urgentContainer) return;
    
    if (urgentCases.length === 0) {
        urgentContainer.innerHTML = '<div class="text-success text-center"><i class="fas fa-check-circle"></i> ไม่มีเคสด่วน</div>';
        return;
    }
    
    const urgentHtml = urgentCases.slice(0, 3).map(student => `
        <div class="urgent-case-item mb-2 p-2 border border-danger rounded">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="fw-bold text-danger">${student['ชื่อและนามสกุล']}</div>
                    <small class="text-muted">${student['ห้องเรียน']}</small>
                    <div class="mt-1">
                        ${student.urgencyReasons.slice(0, 2).map(reason => 
                            `<span class="badge bg-danger me-1" style="font-size: 9px;">${reason}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge bg-danger">${student.urgencyScore}</span>
                    <div class="mt-1">
                        <button class="btn btn-outline-danger btn-sm" onclick="focusOnStudentMap('${student['ชื่อและนามสกุล']}')" title="ดูบนแผนที่">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    urgentContainer.innerHTML = urgentHtml + 
        (urgentCases.length > 3 ? `<div class="text-center mt-2"><small class="text-muted">และอีก ${urgentCases.length - 3} เคส</small></div>` : '');
}

// อัปเดต Badge การแจ้งเตือน
function updateNotificationBadge() {
    // อัปเดต badge ในเมนูหรือ navbar
    const badgeElements = document.querySelectorAll('.urgent-badge');
    badgeElements.forEach(badge => {
        if (urgentCases.length > 0) {
            badge.textContent = urgentCases.length;
            badge.style.display = 'inline';
            badge.className = 'badge bg-danger urgent-badge';
        } else {
            badge.style.display = 'none';
        }
    });
    
    // อัปเดต floating button
    const urgentBtn = document.getElementById('urgentCasesBtn');
    if (urgentBtn) {
        if (urgentCases.length > 0) {
            urgentBtn.style.display = 'block';
        } else {
            urgentBtn.style.display = 'none';
        }
    }
}

// ขอสิทธิ์ Desktop Notification
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('เปิดใช้งานการแจ้งเตือนแล้ว', 'success');
            }
        });
    }
}

// =================================================================
// 📝 ฟังก์ชันระบบหมายเหตุ
// =================================================================

// เพิ่มหมายเหตุให้นักเรียน
function addStudentNote(studentName, noteText, priority = 'normal') {
    if (!studentName || !noteText.trim()) return;
    
    const studentId = studentName;
    if (!studentNotes[studentId]) {
        studentNotes[studentId] = [];
    }
    
    const note = {
        id: Date.now().toString(),
        text: noteText.trim(),
        priority: priority,
        timestamp: new Date().toISOString(),
        author: getCurrentUserName() || 'ผู้ใช้ระบบ'
    };
    
    studentNotes[studentId].push(note);
    saveStudentNotes();
    
    // รีเฟรชการแสดงผล
    if (document.getElementById('notesModal')) {
        displayStudentNotes(studentName);
    }
    
    showToast('บันทึกหมายเหตุสำเร็จ', 'success');
}

// ลบหมายเหตุ
function deleteStudentNote(studentName, noteId) {
    const studentId = studentName;
    if (!studentNotes[studentId]) return;
    
    studentNotes[studentId] = studentNotes[studentId].filter(note => note.id !== noteId);
    saveStudentNotes();
    
    // รีเฟรชการแสดงผล
    if (document.getElementById('notesModal')) {
        displayStudentNotes(studentName);
    }
    
    showToast('ลบหมายเหตุสำเร็จ', 'success');
}

// แสดง Modal หมายเหตุ
function showNotesModal(studentName) {
    const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
    if (!student) return;
    
    const notesModalHTML = `
        <div class="modal fade" id="notesModal" tabindex="-1" aria-labelledby="notesModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title" id="notesModalLabel">
                            <i class="fas fa-sticky-note"></i> หมายเหตุ: ${studentName}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Student Info -->
                        <div class="alert alert-light border">
                            <div class="row">
                                <div class="col-md-6">
                                    <strong>ชื่อ-นามสกุล:</strong> ${student['ชื่อและนามสกุล']}<br>
                                    <strong>ห้องเรียน:</strong> ${student['ห้องเรียน']}
                                </div>
                                <div class="col-md-6">
                                    <strong>สถานะ:</strong> ${student['สถานการณ์เยี่ยม'] === 'เยี่ยมแล้ว' ? 
                                        '<span class="badge bg-success">เยี่ยมแล้ว</span>' : 
                                        '<span class="badge bg-danger">ยังไม่เยี่ยม</span>'}<br>
                                    <strong>วันที่เยี่ยม:</strong> ${student['วันที่'] || 'ไม่ระบุ'}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Add Note Form -->
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-plus"></i> เพิ่มหมายเหตุใหม่</h6>
                            </div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-8">
                                        <textarea id="newNoteText" class="form-control" rows="3" placeholder="พิมพ์หมายเหตุ..."></textarea>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">ระดับความสำคัญ:</label>
                                        <select id="notePriority" class="form-select mb-2">
                                            <option value="normal">ปกติ</option>
                                            <option value="important">สำคัญ</option>
                                            <option value="urgent">ด่วน</option>
                                        </select>
                                        <button type="button" class="btn btn-primary w-100" onclick="addNoteFromModal('${studentName}')">
                                            <i class="fas fa-save"></i> บันทึก
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notes List -->
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0"><i class="fas fa-list"></i> หมายเหตุที่บันทึกไว้</h6>
                                <span id="notesCount" class="badge bg-secondary">0 รายการ</span>
                            </div>
                            <div class="card-body" id="notesContainer" style="max-height: 400px; overflow-y: auto;">
                                <!-- Notes will be loaded here -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-primary" onclick="exportStudentNotes('${studentName}')">
                            <i class="fas fa-download"></i> ส่งออกหมายเหตุ
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing notes modal if any
    const existingModal = document.getElementById('notesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new notes modal
    document.body.insertAdjacentHTML('beforeend', notesModalHTML);
    
    // Show modal and load notes
    const modal = new bootstrap.Modal(document.getElementById('notesModal'));
    modal.show();
    
    // Load existing notes
    displayStudentNotes(studentName);
}

// แสดงหมายเหตุในฟอร์ม
function displayStudentNotes(studentName) {
    const studentId = studentName;
    const notes = studentNotes[studentId] || [];
    const container = document.getElementById('notesContainer');
    const countElement = document.getElementById('notesCount');
    
    if (!container || !countElement) return;
    
    countElement.textContent = `${notes.length} รายการ`;
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-sticky-note fa-3x mb-3"></i>
                <p>ยังไม่มีหมายเหตุ</p>
                <small>เพิ่มหมายเหตุเพื่อติดตามข้อมูลนักเรียน</small>
            </div>
        `;
        return;
    }
    
    // เรียงตามเวลาล่าสุด
    const sortedNotes = notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const notesHtml = sortedNotes.map(note => {
        const date = new Date(note.timestamp);
        const timeAgo = getTimeAgo(date);
        const formattedDate = date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        });
        
        let priorityBadge = '';
        let borderClass = 'border-secondary';
        
        switch(note.priority) {
            case 'urgent':
                priorityBadge = '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle"></i> ด่วน</span>';
                borderClass = 'border-danger';
                break;
            case 'important':
                priorityBadge = '<span class="badge bg-warning text-dark"><i class="fas fa-star"></i> สำคัญ</span>';
                borderClass = 'border-warning';
                break;
            default:
                priorityBadge = '<span class="badge bg-secondary"><i class="fas fa-info-circle"></i> ปกติ</span>';
        }
        
        return `
            <div class="note-item mb-3 p-3 border ${borderClass} rounded">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        ${priorityBadge}
                        <small class="text-muted ms-2">โดย: ${note.author}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <small class="text-muted me-2" title="${formattedDate}">${timeAgo}</small>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteStudentNote('${studentName}', '${note.id}')" title="ลบหมายเหตุ">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-text">
                    ${note.text.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = notesHtml;
}

// เพิ่มหมายเหตุจาก Modal
function addNoteFromModal(studentName) {
    const noteText = document.getElementById('newNoteText').value;
    const priority = document.getElementById('notePriority').value;
    
    if (!noteText.trim()) {
        showToast('กรุณาพิมพ์หมายเหตุ', 'warning');
        return;
    }
    
    addStudentNote(studentName, noteText, priority);
    
    // ล้างฟอร์ม
    document.getElementById('newNoteText').value = '';
    document.getElementById('notePriority').value = 'normal';
}

// ส่งออกหมายเหตุของนักเรียน
function exportStudentNotes(studentName) {
    const studentId = studentName;
    const notes = studentNotes[studentId] || [];
    
    if (notes.length === 0) {
        showToast('ไม่มีหมายเหตุให้ส่งออก', 'warning');
        return;
    }
    
    const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
    
    // สร้างข้อมูล CSV
    const headers = ['ลำดับ', 'วันที่-เวลา', 'ระดับความสำคัญ', 'หมายเหตุ', 'ผู้บันทึก'];
    
    const csvData = notes
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map((note, index) => {
            const date = new Date(note.timestamp);
            const formattedDate = date.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            });
            
            const priorityText = {
                'urgent': 'ด่วน',
                'important': 'สำคัญ',
                'normal': 'ปกติ'
            };
            
            return [
                index + 1,
                formattedDate,
                priorityText[note.priority] || 'ปกติ',
                note.text.replace(/"/g, '""'), // Escape quotes
                note.author
            ];
        });
    
    // เพิ่ม header ข้อมูลนักเรียน
    const studentInfo = [
        ['ข้อมูลนักเรียน'],
        ['ชื่อ-นามสกุล', studentName],
        ['ห้องเรียน', student?.['ห้องเรียน'] || 'ไม่ระบุ'],
        ['สถานะการเยี่ยม', student?.['สถานการณ์เยี่ยม'] || 'ไม่ระบุ'],
        ['วันที่ส่งออก', new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })],
        [''], // Empty row
        ['หมายเหตุทั้งหมด']
    ];
    
    // สร้าง CSV content
    const csvContent = [...studentInfo, headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `หมายเหตุ_${studentName}_${new Date().toLocaleDateString('th-TH')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('ส่งออกหมายเหตุสำเร็จ', 'success');
}

// ดูหมายเหตุย่อในตาราง Priority Cases
function getStudentNotesPreview(studentName) {
    const studentId = studentName;
    const notes = studentNotes[studentId] || [];
    
    if (notes.length === 0) return '';
    
    const urgentNotes = notes.filter(note => note.priority === 'urgent').length;
    const importantNotes = notes.filter(note => note.priority === 'important').length;
    const totalNotes = notes.length;
    
    let preview = `<small class="text-info">📝 ${totalNotes} หมายเหตุ`;
    if (urgentNotes > 0) preview += ` (🚨 ${urgentNotes} ด่วน)`;
    if (importantNotes > 0) preview += ` (⭐ ${importantNotes} สำคัญ)`;
    preview += '</small>';
    
    return preview;
}

// =================================================================
// 📱 Modal แสดงหมายเหตุทั้งหมด
// =================================================================

// แสดง Modal หมายเหตุทั้งหมด
function showAllNotesModal() {
    // โหลดข้อมูลและแสดง modal
    updateAllNotesData();
    const modal = new bootstrap.Modal(document.getElementById('allNotesModal'));
    modal.show();
}

// อัปเดตข้อมูลหมายเหตุทั้งหมด
function updateAllNotesData() {
    // รวบรวมหมายเหตุทั้งหมด
    const allNotes = [];
    Object.keys(studentNotes).forEach(studentName => {
        const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
        if (student && studentNotes[studentName]) {
            studentNotes[studentName].forEach(note => {
                allNotes.push({
                    ...note,
                    studentName: studentName,
                    studentClass: student['ห้องเรียน'] || 'ไม่ระบุ'
                });
            });
        }
    });
    
    // เรียงตามวันที่ล่าสุด
    allNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Populate class filter
    populateAllNotesClassFilter(allNotes);
    
    // แสดงข้อมูล
    displayAllNotes(allNotes);
    updateAllNotesStats(allNotes);
    
    // Update last update time
    const now = new Date();
    const lastUpdateElement = document.getElementById('allNotesLastUpdate');
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
}

// แสดงหมายเหตุทั้งหมดในตาราง
function displayAllNotes(allNotes) {
    const tableBody = document.getElementById('allNotesTableBody');
    const emptyState = document.getElementById('allNotesEmptyState');
    
    if (!tableBody) return;
    
    if (allNotes.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const rows = allNotes.map(note => {
        const date = new Date(note.timestamp);
        const timeAgo = getTimeAgo(date);
        const formattedDate = date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        });
        
        let priorityBadge = '';
        switch(note.priority) {
            case 'urgent':
                priorityBadge = '<span class="badge bg-danger">ด่วน</span>';
                break;
            case 'important':
                priorityBadge = '<span class="badge bg-warning text-dark">สำคัญ</span>';
                break;
            default:
                priorityBadge = '<span class="badge bg-secondary">ปกติ</span>';
        }
        
        return `
            <tr>
                <td><strong>${note.studentName}</strong></td>
                <td>${note.studentClass}</td>
                <td>${priorityBadge}</td>
                <td>${note.text.substring(0, 100)}${note.text.length > 100 ? '...' : ''}</td>
                <td><small>${note.author}</small></td>
                <td><small title="${formattedDate}">${timeAgo}</small></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-info btn-sm" onclick="showNotesModal('${note.studentName}')" title="ดูหมายเหตุ">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteStudentNote('${note.studentName}', '${note.id}')" title="ลบ">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

// อัปเดตสถิติหมายเหตุทั้งหมด
function updateAllNotesStats(allNotes) {
    const urgentCount = allNotes.filter(note => note.priority === 'urgent').length;
    const importantCount = allNotes.filter(note => note.priority === 'important').length;
    const normalCount = allNotes.filter(note => note.priority === 'normal').length;
    const totalCount = allNotes.length;
    const studentsWithNotes = new Set(allNotes.map(note => note.studentName)).size;
    
    // Update DOM elements
    const elements = {
        'urgentNotesCount': urgentCount,
        'importantNotesCount': importantCount,
        'normalNotesCount': normalCount,
        'totalNotesCount': totalCount,
        'studentsWithNotesCount': studentsWithNotes,
        'displayedNotesCount': allNotes.length
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
    
    // Update total notes badge
    const totalNotesBadge = document.getElementById('totalNotesBadge');
    if (totalNotesBadge) {
        if (totalCount > 0) {
            totalNotesBadge.textContent = totalCount;
            totalNotesBadge.style.display = 'inline';
        } else {
            totalNotesBadge.style.display = 'none';
        }
    }
}

// Populate class filter สำหรับหมายเหตุทั้งหมด
function populateAllNotesClassFilter(allNotes) {
    const classSelect = document.getElementById('allNotesClassFilter');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">ทุกห้อง</option>';
    
    const classes = [...new Set(allNotes.map(note => note.studentClass).filter(Boolean))].sort();
    
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.text = className;
        classSelect.appendChild(option);
    });
}

// ส่งออกหมายเหตุทั้งหมด
function exportAllNotes() {
    // รวบรวมข้อมูลทั้งหมด
    const allNotes = [];
    Object.keys(studentNotes).forEach(studentName => {
        const student = homeVisitData.find(s => s['ชื่อและนามสกุล'] === studentName);
        if (student && studentNotes[studentName]) {
            studentNotes[studentName].forEach(note => {
                allNotes.push({
                    ...note,
                    studentName: studentName,
                    studentClass: student['ห้องเรียน'] || 'ไม่ระบุ'
                });
            });
        }
    });
    
    if (allNotes.length === 0) {
        showToast('ไม่มีหมายเหตุให้ส่งออก', 'warning');
        return;
    }
    
    // สร้าง CSV
    const headers = ['ลำดับ', 'นักเรียน', 'ห้องเรียน', 'ระดับความสำคัญ', 'หมายเหตุ', 'ผู้บันทึก', 'วันที่-เวลา'];
    
    const csvData = allNotes
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map((note, index) => {
            const date = new Date(note.timestamp);
            const formattedDate = date.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            });
            
            const priorityText = {
                'urgent': 'ด่วน',
                'important': 'สำคัญ',
                'normal': 'ปกติ'
            };
            
            return [
                index + 1,
                note.studentName,
                note.studentClass,
                priorityText[note.priority] || 'ปกติ',
                note.text.replace(/"/g, '""'), // Escape quotes
                note.author,
                formattedDate
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
    link.setAttribute('download', `หมายเหตุทั้งหมด_${new Date().toLocaleDateString('th-TH')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('ส่งออกหมายเหตุทั้งหมดสำเร็จ', 'success');
}

// ล้างตัวกรองหมายเหตุทั้งหมด
function clearAllNotesFilters() {
    const filters = ['allNotesSearch', 'allNotesPriorityFilter', 'allNotesClassFilter', 'allNotesTimeFilter'];
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    updateAllNotesData();
}

// รีเฟรชหมายเหตุทั้งหมด
function refreshAllNotes() {
    updateAllNotesData();
}

// =================================================================
// 🔧 ฟังก์ชันเสริมและ Utilities
// =================================================================

// แสดง Toast notification
function showToast(message, type = 'info') {
    // ลบ toast เก่าถ้ามี
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const typeClasses = {
        'success': 'bg-success text-white',
        'error': 'bg-danger text-white',
        'warning': 'bg-warning text-dark',
        'info': 'bg-info text-white'
    };
    
    const toastHtml = `
        <div class="toast-notification position-fixed" style="top: 80px; right: 20px; z-index: 9999;">
            <div class="toast show ${typeClasses[type] || typeClasses.info}" role="alert">
                <div class="toast-body d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    
    // ลบ toast หลัง 3 วินาที
    setTimeout(() => {
        const toast = document.querySelector('.toast-notification');
        if (toast) {
            toast.remove();
        }
    }, 3000);
}

// ดึงชื่อผู้ใช้ปัจจุบัน (จาก LIFF หรือ localStorage)
function getCurrentUserName() {
    try {
        // จาก LIFF profile
        const profileName = document.getElementById('profile-name')?.textContent;
        if (profileName && profileName.trim()) {
            return profileName.trim();
        }
        
        // จาก localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            return savedUser;
        }
        
        return 'ผู้ใช้ระบบ';
    } catch (error) {
        return 'ผู้ใช้ระบบ';
    }
}

// =================================================================
// 🔔 แถบแจ้งเตือนด้านบนหน้าจอ
// =================================================================

// สร้างแถบแจ้งเตือนคงที่
function createNotificationBar() {
    const notificationBarHTML = `
        <div id="notificationBar" class="alert alert-danger alert-dismissible fade show" role="alert" style="position: fixed; top: 70px; left: 0; right: 0; z-index: 999; margin: 0; border-radius: 0; display: none;">
            <div class="container d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle fa-lg me-3"></i>
                    <div>
                        <strong id="notificationTitle">🚨 แจ้งเตือนเคสด่วน</strong>
                        <div id="notificationMessage">พบเคสที่ต้องให้ความสำคัญเร่งด่วน</div>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-light btn-sm me-2" onclick="showAllUrgentCases()">
                        <i class="fas fa-list"></i> ดูทั้งหมด
                    </button>
                    <button type="button" class="btn-close" onclick="hideNotificationBar()" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    
    // เพิ่ม notification bar ลงใน body
    document.body.insertAdjacentHTML('afterbegin', notificationBarHTML);
}

// แสดงแถบแจ้งเตือน
function showNotificationBar() {
    const notificationBar = document.getElementById('notificationBar');
    const contentSection = document.getElementById('content-section');
    
    if (notificationBar && urgentCases.length > 0) {
        const urgentCount = urgentCases.length;
        const topCase = urgentCases[0];
        
        document.getElementById('notificationMessage').textContent = 
            `พบ ${urgentCount} เคส - เคสด่วนสุด: ${topCase['ชื่อและนามสกุล']} (${topCase['ห้องเรียน']})`;
        
        notificationBar.style.display = 'block';
        
        // ปรับ margin ของ content
        if (contentSection) {
            contentSection.style.marginTop = '140px';
        }
    }
}

// ซ่อนแถบแจ้งเตือน
function hideNotificationBar() {
    const notificationBar = document.getElementById('notificationBar');
    const contentSection = document.getElementById('content-section');
    
    if (notificationBar) {
        notificationBar.style.display = 'none';
        
        // คืน margin เดิม
        if (contentSection) {
            contentSection.style.marginTop = '70px';
        }
    }
}

// =================================================================
// ⚙️ ระบบตั้งค่าการแจ้งเตือน
// =================================================================

// ฟังก์ชันสำหรับแสดง Modal ตั้งค่า
function showNotificationSettings() {
    // Load current settings
    loadNotificationSettings();
    
    const elements = {
        'enableNotifications': notificationSettings.enabled,
        'autoCheck': notificationSettings.autoCheck,
        'soundNotification': notificationSettings.sound,
        'desktopNotification': notificationSettings.desktop,
        'urgentThreshold': notificationSettings.urgentThreshold,
        'checkInterval': notificationSettings.checkInterval
    };
    
    // Load settings into form
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = elements[id];
            } else {
                element.value = elements[id];
            }
        }
    });
    
    // Update threshold display
    const thresholdValue = document.getElementById('thresholdValue');
    if (thresholdValue) {
        thresholdValue.textContent = notificationSettings.urgentThreshold;
    }
    
    // Update notification permission status
    updateNotificationPermissionStatus();
    
    // Update statistics
    updateNotificationStats();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('notificationSettingsModal'));
    modal.show();
}

// อัปเดตสถานะ permission
function updateNotificationPermissionStatus() {
    const statusElement = document.getElementById('notificationPermissionStatus');
    if (!statusElement) return;
    
    if ('Notification' in window) {
        switch (Notification.permission) {
            case 'granted':
                statusElement.innerHTML = '<small class="text-success"><i class="fas fa-check"></i> อนุญาตแล้ว</small>';
                break;
            case 'denied':
                statusElement.innerHTML = '<small class="text-danger"><i class="fas fa-times"></i> ถูกปฏิเสธ</small>';
                break;
            default:
                statusElement.innerHTML = '<button class="btn btn-sm btn-outline-primary" onclick="requestNotificationPermission()">ขอสิทธิ์</button>';
        }
    } else {
        statusElement.innerHTML = '<small class="text-muted">ไม่รองรับ</small>';
    }
}

// อัปเดตสถิติการแจ้งเตือน
function updateNotificationStats() {
    const elements = {
        'totalUrgentCases': urgentCases.length,
        'todayNotifications': 0, // จะต้องเก็บ log การแจ้งเตือน
        'lastCheckTime': new Date().toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok'
        })
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

// บันทึกการตั้งค่า
function saveNotificationSettings() {
    const settings = {
        enabled: document.getElementById('enableNotifications')?.checked || false,
        autoCheck: document.getElementById('autoCheck')?.checked || false,
        sound: document.getElementById('soundNotification')?.checked || false,
        desktop: document.getElementById('desktopNotification')?.checked || false,
        urgentThreshold: parseInt(document.getElementById('urgentThreshold')?.value) || 6,
        checkInterval: parseInt(document.getElementById('checkInterval')?.value) || 300000
    };
    
    notificationSettings = { ...notificationSettings, ...settings };
    
    // บันทึกลง localStorage
    try {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
    } catch (error) {
        showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
    
    // ปิด modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('notificationSettingsModal'));
    if (modal) modal.hide();
    
    // ตรวจสอบเคสด่วนใหม่
    if (homeVisitData && homeVisitData.length > 0) {
        checkUrgentCases();
    }
}

// รีเซ็ตการตั้งค่า
function resetNotificationSettings() {
    notificationSettings = {
        enabled: true,
        autoCheck: true,
        checkInterval: 300000,
        sound: true,
        desktop: true,
        urgentThreshold: 6,
        daysThreshold: 30
    };
    
    showNotificationSettings();
    showToast('รีเซ็ตการตั้งค่าแล้ว', 'info');
}

// ทดสอบการแจ้งเตือน
function testNotification() {
    if (notificationSettings.sound) {
        playNotificationSound();
    }
    
    if (notificationSettings.desktop && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🧪 ทดสอบการแจ้งเตือน', {
            body: 'ระบบการแจ้งเตือนทำงานปกติ',
            icon: 'https://raw.githubusercontent.com/infobwd/STUDENT-CARE/main/icons8-information-96.png'
        });
    }
    
    showToast('ทดสอบการแจ้งเตือนแล้ว', 'success');
}

// =================================================================
// 🎨 เพิ่ม CSS สำหรับฟีเจอร์ใหม่
// =================================================================

const additionalNotificationCSS = `
/* Notification styles */
.toast-notification .toast {
    border: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.urgent-case-item {
    transition: all 0.3s ease;
}

.urgent-case-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.note-item {
    transition: all 0.3s ease;
}

.note-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.note-text {
    white-space: pre-wrap;
    word-wrap: break-word;
}

#notificationBar {
    animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Urgent badge pulse animation */
.urgent-badge {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

/* Floating buttons */
.floating-actions {
    position: fixed;
    bottom: 100px;
    right: 25px;
    z-index: 998;
}

.floating-actions .btn {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
}

.floating-actions .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

/* Mobile responsive */
@media (max-width: 768px) {
    #notificationBar .container {
        flex-direction: column;
        align-items: flex-start;
    }
    
    #notificationBar .d-flex:last-child {
        align-self: flex-end;
        margin-top: 10px;
    }
    
    .floating-actions {
        bottom: 80px;
        right: 15px;
    }
    
    .floating-actions .btn {
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
    }
}
`;

// เพิ่ม CSS ใหม่
function addNotificationCSS() {
    const style = document.createElement('style');
    style.textContent = additionalNotificationCSS;
    document.head.appendChild(style);
}

// =================================================================
// 🚀 Initialization
// =================================================================

// เรียกใช้เมื่อ DOM โหลด
document.addEventListener('DOMContentLoaded', function() {
    // Load settings and notes
    loadNotificationSettings();
    loadStudentNotes();
    
    // Add CSS
    addNotificationCSS();
    
    // Create notification bar
    createNotificationBar();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Setup threshold slider event
    const thresholdSlider = document.getElementById('urgentThreshold');
    if (thresholdSlider) {
        thresholdSlider.addEventListener('input', function() {
            const valueDisplay = document.getElementById('thresholdValue');
            if (valueDisplay) {
                valueDisplay.textContent = this.value;
            }
        });
    }
});

console.log('🔔 Urgent Notifications & Notes System loaded successfully!');// =================================================================
// 🔔 ระบบแจ้งเตือนเคสด่วน (Urgent Case Notifications)
// =================================================================

// Global variables สำหรับระบบแจ้งเตือน
let urgentCases = [];
let notificationSettings = {
    enabled: true,
    autoCheck: true,
    checkInterval: 300000, // 5 นาที
    sound: true,
    desktop: true,
    urgentThreshold: 6, // คะแนนขั้นต่ำสำหรับเคสด่วน
    daysThreshold: 30 // จำนวนวันที่ยังไม่เยี่ยม
};

// =================================================================
// 📝 ระบบบันทึกหมายเหตุ (Notes System)
// =================================================================

// Global variables สำหรับระบบหมายเหตุ
let studentNotes = {};

// โหลดหมายเหตุจาก localStorage
function loadStudentNotes() {
    try {
        const saved = localStorage.getItem('studentNotes');
        studentNotes = saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Error loading notes:', error);
        studentNotes = {};
    }
}

// บันทึกหมายเหตุไป localStorage
function saveStudentNotes() {
    try {
        localStorage.setItem('studentNotes', JSON.stringify(studentNotes));
        showToast('บันทึกหมายเหตุสำเร็จ', 'success');
    } catch (error) {
        console.error('Error saving notes:', error);
        showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
}

// โหลดการตั้งค่าการแจ้งเตือน
function loadNotificationSettings() {
    try {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Error loading notification settings:', error);
    }
}

// =================================================================
// 🔔 ฟังก์ชันระบบแจ้งเตือน
// =================================================================

// ตรวจสอบเคสด่วน
function checkUrgentCases() {
    if (!homeVisitData || homeVisitData.length === 0) return;
    
    const today = new Date();
    urgentCases = [];
    
    homeVisitData.forEach(student => {
        let urgencyScore = 0;
        let reasons = [];
        
        // ยังไม่เยี่ยม
        const notVisited = student['สถานการณ์เยี่ยม'] !== 'เยี่ยมแล้ว';
        if (notVisited) {
            urgencyScore += 3;
            reasons.push('ยังไม่เยี่ยม');
            
            // ตรวจสอบว่าเลยกำหนดเวลาหรือไม่
            const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 2 เดือนที่แล้ว
            if (today > startDate) {
                urgencyScore += 2;
                reasons.push('เลยกำหนดเวลา');
            }
        }
        
        // รายได้ต่ำมาก
        const income = student['รายได้'] ? parseFloat(student['รายได้'].replace(/[฿,]/g, '')) : 0;
        if (income > 0 && income < 3000) {
            urgencyScore += 3;
            reasons.push('รายได้ต่ำมาก');
        } else if (income >= 3000 && income < 5000) {
            urgencyScore += 2;
            reasons.push('รายได้ต่ำ');
        }
        
        // ได้สวัสดิการ + รายได้ต่ำ
        if (student['ได้สวัสดิการแห่งรัฐ'] === 'TRUE' && income < 5000) {
            urgencyScore += 2;
            reasons.push('ต้องการความช่วยเหลือ');
        }
        
        // มีภาระพึ่งพิง
        if (student['ครัวเรือนมีภาระพึ่งพิง']) {
            urgencyScore += 2;
            reasons.push('มีภาระพึ่งพิง');
        }
        
        // อยู่ไกลมาก
        if (student.distanceFromSchool && student.distanceFromSchool > 10) {
            urgencyScore += 1;
            reasons.push('อยู่ไกลมาก');
        }
        
        // มีหมายเหตุพิเศษ
        const studentId = student['ชื่อและนามสกุล'];
        if (studentNotes[studentId] && studentNotes[studentId].some(note => note.priority === 'urgent')) {
            urgencyScore += 2;
            reasons.push('มีหมายเหตุด่วน');
        }
        
        // เพิ่มเข้าลิสต์เคสด่วนถ้าคะแนน >= threshold
        if (urgencyScore >= notificationSettings.urgentThreshold) {
            urgentCases.push({
                ...student,
                urgencyScore,
                urgencyReasons: reasons,
                lastChecked: today.toISOString()
            });
        }
    });
    
    // เรียงตามความด่วน
    urgentCases.sort((a, b) => b.urgencyScore - a.urgencyScore);
    
    // แสดงการแจ้งเตือน
    if (urgentCases.length > 0 && notificationSettings.enabled) {
        showUrgentNotification();
    }
    
    // อัปเดต UI
    updateUrgentCasesDisplay();
    updateNotificationBadge();
}

// แสดงการแจ้งเตือน
function showUrgentNotification() {
    const urgentCount = urgentCases.length;
    const topCase = urgentCases[0];
    
    // Desktop notification
    if (notificationSettings.desktop && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(`🚨 เคสด่วน ${urgentCount} รายการ`, {
                body: `${topCase['ชื่อและนามสกุล']} (${topCase['ห้องเรียน']}) - คะแนน: ${topCase.urgencyScore}`,
                icon: 'https://raw.githubusercontent.com/infobwd/STUDENT-CARE/main/icons8-information-96.png',
                tag: 'urgent-case'
            });
        }
    }
    
    // เสียงแจ้งเตือน
    if (notificationSettings.sound) {
        playNotificationSound();
    }
    
    // แสดง Modal แจ้งเตือน
    showUrgentAlert();
}

// เล่นเสียงแจ้งเตือน
function playNotificationSound() {
    try {
        // ใช้ Web Audio API สร้างเสียง beep
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

// แสดง Modal แจ้งเตือนเคสด่วน
function showUrgentAlert() {
    const urgentCount = urgentCases.length;
    const topCases = urgentCases.slice(0, 3);
    
    const alertHTML = `
        <div class="modal fade" id="urgentAlertModal" tabindex="-1" aria-labelledby="urgentAlertModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-danger">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="urgentAlertModalLabel">
                            <i class="fas fa-exclamation-triangle"></i> 🚨 แจ้งเตือนเคสด่วน
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning d-flex align-items-center">
                            <i class="fas fa-bell fa-2x me-3"></i>
                            <div>
                                <h6 class="mb-1">พบเคสที่ต้องให้ความสำคัญเร่งด่วน ${urgentCount} รายการ</h6>
                                <small>กรุณาตรวจสอบและดำเนินการเยี่ยมบ้านโดยเร็วที่สุด</small>
                            </div>
                        </div>
                        
                        <div class="row">
                            ${topCases.map((student, index) => `
                                <div class="col-md-4 mb-3">
                                    <div class="card border-danger">
                                        <div class="card-header bg-danger text-white text-center">
                                            <small>อันดับ ${index + 1}</small>
                                        </div>
                                        <div class="card-body text-center">
                                            <h6 class="card-title">${student['ชื่อและนามสกุล']}</h6>
                                            <p class="card-text">
                                                <span class="badge bg-secondary">${student['ห้องเรียน']}</span><br>
                                                <span class="badge bg-danger mt-1">คะแนน: ${student.urgencyScore}</span>
                                            </p>
                                            <div class="d-flex flex-wrap gap-1 justify-content-center mb-2">
                                                ${student.urgencyReasons.slice(0, 2).map(reason => 
                                                    `<span class="badge bg-warning text-dark" style="font-size: 10px;">${reason}</span>`
                                                ).join('')}
                                            </div>
                                            <button class="btn btn-outline-primary btn-sm" onclick="focusOnUrgentCase('${student['ชื่อและนามสกุล']}')">
                                                <i class="fas fa-map-marker-alt"></i> ดูแผนที่
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        ${urgentCount > 3 ? `
                            <div class="text-center mt-3">
                                <button class="btn btn-outline-danger" onclick="showAllUrgentCases()">
                                    <i class="fas fa-list"></i> ดูเคสด่วนทั้งหมด (${urgentCount} รายการ)
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="snoozeNotification(30)">
                            <i class="fas fa-clock"></i> เตือนอีกครั้งใน 30 นาที
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                        <button type="button" class="btn btn-danger" onclick="dismissUrgentAlert()">
                            <i class="fas fa-check"></i> รับทราบแล้ว
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing alert modal if any
    const existingModal = document.getElementById('urgentAlertModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new alert modal
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('urgentAlertModal'));
    modal.show();
}

// Focus ไปที่เคสด่วนบนแผนที่
function focusOnUrgentCase(studentName) {
    // ปิด Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('urgentAlertModal'));
    if (modal) modal.hide();
    
    // Focus ไปที่แผนที่
    focusOnStudentMap(studentName);
}

// แสดงเคสด่วนทั้งหมด
function showAllUrgentCases() {
    // ปิด Modal แจ้งเตือน
    const modal = bootstrap.Modal.getInstance(document.getElementById('urgentAlertModal'));
    if (modal) modal.hide();
    
    // เปิด Priority Cases Modal และกรองเฉพาะเคสด่วน
    showPriorityCasesModal();
    setTimeout(() => {
        const levelFilter = document.getElementById('priorityLevelFilter');
        if (levelFilter) {
            levelFilter.value = 'high';
            filterPriorityCases();
        }
    }, 500);
}

