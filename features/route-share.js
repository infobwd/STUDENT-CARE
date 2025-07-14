// features/route-share.js
// โมดูลสำหรับแชร์เส้นทางการเยี่ยมบ้านผ่าน LINE
// Version: 1.0.0
// Created: 2025

const RouteShare = {
    isLiffReady: false,
    shareHistory: [],
    
    // เริ่มต้นระบบ
    async init() {
        console.log('🔗 Initializing Route Share module...');
        
        try {
            await this.initializeLiff();
            this.loadShareHistory();
            console.log('✅ Route Share module initialized successfully');
        } catch (error) {
            console.error('❌ Route Share initialization failed:', error);
        }
    },
    
    // เริ่มต้น LIFF
    async initializeLiff() {
        if (typeof liff === 'undefined') {
            console.warn('⚠️ LIFF SDK not loaded');
            return;
        }
        
        try {
            await liff.init({ liffId: '2005494853-ZDznGqqe' });
            this.isLiffReady = true;
            console.log('✅ LIFF initialized for route sharing');
        } catch (error) {
            console.error('❌ LIFF initialization failed:', error);
            this.isLiffReady = false;
        }
    },
    
    // แชร์เส้นทางผ่าน LINE
    async shareToLine(routeData) {
        console.log('📤 Starting LINE share process...');
        
        if (!this.validateRouteData(routeData)) {
            this.showMessage('ข้อมูลเส้นทางไม่ถูกต้อง', 'error');
            return;
        }
        
        // แสดง loading
        this.setShareButtonLoading(true);
        
        try {
            if (this.isLiffReady && liff.isLoggedIn()) {
                await this.shareFlexMessage(routeData);
            } else {
                // Fallback: copy text to clipboard
                await this.copyRouteToClipboard(routeData);
            }
        } catch (error) {
            console.error('❌ Share failed:', error);
            this.showMessage('การแชร์ล้มเหลว: ' + error.message, 'error');
        } finally {
            this.setShareButtonLoading(false);
        }
    },
    
    // ตรวจสอบข้อมูลเส้นทาง
    validateRouteData(routeData) {
        return routeData && 
               routeData.students && 
               Array.isArray(routeData.students) && 
               routeData.students.length > 0 &&
               routeData.totalDistance !== undefined &&
               routeData.estimatedTime !== undefined;
    },
    
    // แชร์ Flex Message
    async shareFlexMessage(routeData) {
        console.log('📱 Creating Flex Message...');
        
        const flexMessage = this.selectFlexMessageType(routeData);
        
        try {
            await liff.shareTargetPicker([flexMessage]);
            this.showMessage('แชร์เส้นทางเรียบร้อยแล้ว! 🎉', 'success');
            this.trackShareEvent(routeData);
            console.log('✅ Flex message shared successfully');
        } catch (error) {
            if (error.type === 'CANCEL') {
                this.showMessage('ยกเลิกการแชร์', 'error');
            } else {
                throw error;
            }
        }
    },
    
    // เลือกรูปแบบ Flex Message ตามจำนวนนักเรียน
    selectFlexMessageType(routeData) {
        if (routeData.students.length <= 3) {
            return this.createCompactFlexMessage(routeData);
        } else {
            return this.createRouteFlexMessage(routeData);
        }
    },
    
    // สร้าง Flex Message แบบกะทัดรัด (สำหรับเส้นทางสั้น)
    createCompactFlexMessage(routeData) {
        const currentDateTime = new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            timeZone: 'Asia/Bangkok'
        });
        
        return {
            type: "flex",
            altText: `เส้นทางเยี่ยมบ้าน ${routeData.students.length} ครัวเรือน`,
            contents: {
                type: "bubble",
                size: "kilo",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "🏠 เส้นทางเยี่ยมบ้าน",
                            weight: "bold",
                            size: "lg",
                            color: "#ffffff"
                        }
                    ],
                    backgroundColor: "#1a73e8",
                    paddingAll: "15px"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                {
                                    type: "text",
                                    text: "👥",
                                    flex: 1
                                },
                                {
                                    type: "text",
                                    text: `${routeData.students.length} ครัวเรือน`,
                                    flex: 4,
                                    weight: "bold",
                                    color: "#1a73e8"
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                {
                                    type: "text",
                                    text: "📏",
                                    flex: 1
                                },
                                {
                                    type: "text",
                                    text: `${routeData.totalDistance.toFixed(1)} กม.`,
                                    flex: 4,
                                    color: "#28a745"
                                }
                            ],
                            margin: "sm"
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                {
                                    type: "text",
                                    text: "⏱️",
                                    flex: 1
                                },
                                {
                                    type: "text",
                                    text: `${Math.floor(routeData.estimatedTime / 60)}:${String(routeData.estimatedTime % 60).padStart(2, '0')} ชม.`,
                                    flex: 4,
                                    color: "#ffc107"
                                }
                            ],
                            margin: "sm"
                        }
                    ],
                    paddingAll: "15px"
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
                                uri: routeData.googleMapsUrl
                            },
                            color: "#1a73e8"
                        },
                        {
                            type: "text",
                            text: currentDateTime,
                            size: "xs",
                            color: "#999999",
                            align: "center",
                            margin: "sm"
                        }
                    ],
                    paddingAll: "15px"
                }
            }
        };
    },
    
    // สร้าง Flex Message สำหรับเส้นทาง (แบบเต็ม)
    createRouteFlexMessage(routeData) {
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
        
        // สร้างรายการนักเรียน (แสดงสูงสุด 8 คน)
        const studentList = routeData.students.slice(0, 8).map((student, index) => ({
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
                {
                    type: "text",
                    text: `${index + 1}.`,
                    color: "#666666",
                    size: "sm",
                    flex: 1
                },
                {
                    type: "text",
                    text: student.name || 'ไม่ระบุ',
                    wrap: true,
                    color: "#333333",
                    size: "sm",
                    flex: 4,
                    weight: "bold"
                },
                {
                    type: "text",
                    text: student.classroom || '',
                    color: "#666666",
                    size: "xs",
                    flex: 2,
                    align: "end"
                }
            ]
        }));
        
        // เพิ่มข้อความถ้ามีนักเรียนเหลือ
        if (routeData.students.length > 8) {
            studentList.push({
                type: "text",
                text: `และอีก ${routeData.students.length - 8} คน...`,
                color: "#999999",
                size: "xs",
                align: "center",
                margin: "md"
            });
        }
        
        return {
            type: "flex",
            altText: `แผนการเยี่ยมบ้าน ${routeData.students.length} ครัวเรือน`,
            contents: {
                type: "bubble",
                size: "giga",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "🏠 แผนการเยี่ยมบ้านนักเรียน",
                            weight: "bold",
                            size: "xl",
                            color: "#ffffff",
                            align: "center"
                        },
                        {
                            type: "text",
                            text: "ลำดับการเยี่ยม (เรียงตามระยะทาง)",
                            size: "sm",
                            color: "#ffffff",
                            align: "center",
                            margin: "md"
                        }
                    ],
                    backgroundColor: "#1a73e8",
                    paddingAll: "20px",
                    cornerRadius: "10px"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        // สรุปข้อมูล
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "📊 สรุปข้อมูลเส้นทาง",
                                    weight: "bold",
                                    size: "md",
                                    color: "#1a73e8"
                                },
                                {
                                    type: "separator",
                                    margin: "md"
                                }
                            ]
                        },
                        // ข้อมูลสถิติ
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
                                            text: "👥 จำนวนครัวเรือน",
                                            color: "#666666",
                                            size: "sm",
                                            flex: 4
                                        },
                                        {
                                            type: "text",
                                            text: `${routeData.students.length} ครัวเรือน`,
                                            wrap: true,
                                            color: "#1a73e8",
                                            size: "sm",
                                            flex: 3,
                                            weight: "bold",
                                            align: "end"
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
                                            text: "🛣️ ระยะทางรวม",
                                            color: "#666666",
                                            size: "sm",
                                            flex: 4
                                        },
                                        {
                                            type: "text",
                                            text: `${routeData.totalDistance.toFixed(1)} กม.`,
                                            wrap: true,
                                            color: "#28a745",
                                            size: "sm",
                                            flex: 3,
                                            weight: "bold",
                                            align: "end"
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
                                            text: "⏱️ เวลาประมาณ",
                                            color: "#666666",
                                            size: "sm",
                                            flex: 4
                                        },
                                        {
                                            type: "text",
                                            text: `${Math.floor(routeData.estimatedTime / 60)}:${String(routeData.estimatedTime % 60).padStart(2, '0')} ชม.`,
                                            wrap: true,
                                            color: "#ffc107",
                                            size: "sm",
                                            flex: 3,
                                            weight: "bold",
                                            align: "end"
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
                                            text: "🚗 การเดินทาง",
                                            color: "#666666",
                                            size: "sm",
                                            flex: 4
                                        },
                                        {
                                            type: "text",
                                            text: routeData.travelMode || 'ขับรถ',
                                            wrap: true,
                                            color: "#17a2b8",
                                            size: "sm",
                                            flex: 3,
                                            weight: "bold",
                                            align: "end"
                                        }
                                    ]
                                }
                            ]
                        },
                        // รายการนักเรียน
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "xl",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "📋 รายการนักเรียน",
                                    weight: "bold",
                                    size: "md",
                                    color: "#1a73e8"
                                },
                                {
                                    type: "separator",
                                    margin: "md"
                                },
                                ...studentList
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
                            margin: "md"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "md",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: `📅 สร้างเมื่อ: ${currentDateTime}`,
                                    size: "xs",
                                    color: "#999999",
                                    align: "center"
                                },
                                {
                                    type: "text",
                                    text: "ระบบสารสนเทศเยี่ยมบ้านนักเรียน",
                                    size: "xs",
                                    color: "#999999",
                                    align: "center"
                                }
                            ]
                        },
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "🗺️ เปิด Google Maps",
                                uri: routeData.googleMapsUrl
                            },
                            color: "#1a73e8",
                            margin: "lg"
                        }
                    ],
                    spacing: "sm",
                    paddingTop: "10px"
                }
            }
        };
    },
    
    // คัดลอกข้อความไปยัง Clipboard (สำรอง)
    async copyRouteToClipboard(routeData) {
        console.log('📋 Copying route to clipboard...');
        
        const routeText = this.generateRouteText(routeData);
        
        try {
            await navigator.clipboard.writeText(routeText);
            this.showMessage('คัดลอกข้อมูลเส้นทางแล้ว กรุณานำไปแชร์ใน LINE', 'success');
        } catch (error) {
            // Fallback method
            this.fallbackCopyToClipboard(routeText);
        }
    },
    
    // สร้างข้อความเส้นทาง
    generateRouteText(routeData) {
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
        
        let text = `🏠 แผนการเยี่ยมบ้านนักเรียน\n`;
        text += `ลำดับการเยี่ยม (เรียงตามระยะทาง)\n\n`;
        
        text += `📊 สรุปข้อมูลเส้นทาง:\n`;
        text += `👥 จำนวน: ${routeData.students.length} ครัวเรือน\n`;
        text += `🛣️ ระยะทาง: ${routeData.totalDistance.toFixed(1)} กม.\n`;
        text += `⏱️ เวลา: ${Math.floor(routeData.estimatedTime / 60)}:${String(routeData.estimatedTime % 60).padStart(2, '0')} ชม.\n`;
        text += `🚗 การเดินทาง: ${routeData.travelMode}\n\n`;
        
        text += `📋 รายการนักเรียน:\n`;
        routeData.students.forEach((student, index) => {
            text += `${index + 1}. ${student.name} (${student.classroom || 'ไม่ระบุ'})\n`;
        });
        
        text += `\n🗺️ Google Maps: ${routeData.googleMapsUrl}\n\n`;
        text += `📅 สร้างเมื่อ: ${currentDateTime}\n`;
        text += `ระบบสารสนเทศเยี่ยมบ้านนักเรียน`;
        
        return text;
    },
    
    // วิธีคัดลอกสำรอง
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showMessage('คัดลอกข้อมูลเส้นทางแล้ว กรุณานำไปแชร์ใน LINE', 'success');
        } catch (err) {
            this.showMessage('ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง', 'error');
            console.error('❌ Clipboard copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    },
    
    // ตั้งค่าสถานะปุ่มแชร์
    setShareButtonLoading(loading) {
        const shareBtn = document.querySelector('[onclick="shareRouteToLine()"]');
        if (!shareBtn) return;
        
        if (loading) {
            shareBtn.classList.add('btn-loading');
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<span style="opacity: 0;">แชร์ LINE</span>';
        } else {
            shareBtn.classList.remove('btn-loading');
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<i class="fab fa-line"></i> แชร์ LINE';
        }
    },
    
    // แสดงข้อความแจ้งเตือน
    showMessage(message, type = 'success') {
        // ลบข้อความเก่า
        const existingMessages = document.querySelectorAll('.share-message');
        existingMessages.forEach(msg => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 300);
        });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `share-message ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
        messageDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            ${message}
        `;
        
        document.body.appendChild(messageDiv);
        
        // ลบข้อความหลัง 4 วินาที
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.classList.add('fade-out');
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 4000);
    },
    
    // ติดตามสถิติการแชร์
    trackShareEvent(routeData) {
        try {
            const shareData = {
                id: 'share_' + Date.now(),
                timestamp: new Date().toISOString(),
                studentsCount: routeData.students.length,
                totalDistance: routeData.totalDistance,
                estimatedTime: routeData.estimatedTime,
                travelMode: routeData.travelMode,
                students: routeData.students.map(s => ({
                    name: s.name,
                    classroom: s.classroom
                })),
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`
            };
            
            this.shareHistory.push(shareData);
            this.saveShareHistory();
            
            console.log('📊 Share event tracked:', shareData.id);
        } catch (error) {
            console.warn('⚠️ Failed to track share event:', error);
        }
    },
    
    // โหลดประวัติการแชร์
    loadShareHistory() {
        try {
            const stored = localStorage.getItem('routeShareHistory');
            if (stored) {
                this.shareHistory = JSON.parse(stored);
                console.log(`📚 Loaded ${this.shareHistory.length} share history records`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load share history:', error);
            this.shareHistory = [];
        }
    },
    
    // บันทึกประวัติการแชร์
    saveShareHistory() {
        try {
            // เก็บแค่ 100 รายการล่าสุด
            if (this.shareHistory.length > 100) {
                this.shareHistory = this.shareHistory.slice(-100);
            }
            
            localStorage.setItem('routeShareHistory', JSON.stringify(this.shareHistory));
        } catch (error) {
            console.warn('⚠️ Failed to save share history:', error);
        }
    },
    
    // ดึงสถิติการแชร์
    getShareStatistics() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            const todayShares = this.shareHistory.filter(share => {
                const shareDate = new Date(share.timestamp);
                const shareDateOnly = new Date(shareDate.getFullYear(), shareDate.getMonth(), shareDate.getDate());
                return shareDateOnly.getTime() === today.getTime();
            });
            
            const weekShares = this.shareHistory.filter(share => {
                const shareDate = new Date(share.timestamp);
                return shareDate >= oneWeekAgo;
            });
            
            const monthShares = this.shareHistory.filter(share => {
                const shareDate = new Date(share.timestamp);
                return shareDate >= oneMonthAgo;
            });
            
            return {
                total: this.shareHistory.length,
                today: todayShares.length,
                thisWeek: weekShares.length,
                thisMonth: monthShares.length,
                avgStudents: this.shareHistory.length > 0 ? 
                    (this.shareHistory.reduce((sum, share) => sum + share.studentsCount, 0) / this.shareHistory.length).toFixed(1) : 0,
                avgDistance: this.shareHistory.length > 0 ? 
                    (this.shareHistory.reduce((sum, share) => sum + share.totalDistance, 0) / this.shareHistory.length).toFixed(1) : 0,
                avgTime: this.shareHistory.length > 0 ? 
                    (this.shareHistory.reduce((sum, share) => sum + share.estimatedTime, 0) / this.shareHistory.length).toFixed(0) : 0,
                mostPopularTravelMode: this.getMostPopularTravelMode(),
                recentShares: this.shareHistory.slice(-5).reverse()
            };
        } catch (error) {
            console.warn('⚠️ Failed to get share statistics:', error);
            return {
                total: 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                avgStudents: 0,
                avgDistance: 0,
                avgTime: 0,
                mostPopularTravelMode: 'ขับรถ',
                recentShares: []
            };
        }
    },
    
    // หาโหมดการเดินทางที่นิยมสุด
    getMostPopularTravelMode() {
        try {
            const modeCount = {};
            this.shareHistory.forEach(share => {
                const mode = share.travelMode || 'ขับรถ';
                modeCount[mode] = (modeCount[mode] || 0) + 1;
            });
            
            let mostPopular = 'ขับรถ';
            let maxCount = 0;
            
            Object.entries(modeCount).forEach(([mode, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    mostPopular = mode;
                }
            });
            
            return mostPopular;
        } catch (error) {
            return 'ขับรถ';
        }
    },
    
    // ล้างประวัติการแชร์
    clearShareHistory() {
        try {
            this.shareHistory = [];
            localStorage.removeItem('routeShareHistory');
            this.showMessage('ล้างประวัติการแชร์เรียบร้อยแล้ว', 'success');
            console.log('🗑️ Share history cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear share history:', error);
            this.showMessage('ไม่สามารถล้างประวัติได้', 'error');
        }
    },
    
    // ส่งออกประวัติการแชร์
    exportShareHistory() {
        try {
            const data = {
                exportDate: new Date().toISOString(),
                statistics: this.getShareStatistics(),
                history: this.shareHistory
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `route-share-history-${new Date().toISOString().split('T')[0]}.json`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.showMessage('ส่งออกประวัติการแชร์เรียบร้อยแล้ว', 'success');
            console.log('📤 Share history exported');
        } catch (error) {
            console.warn('⚠️ Failed to export share history:', error);
            this.showMessage('ไม่สามารถส่งออกประวัติได้', 'error');
        }
    },
    
    // สร้าง URL สำหรับแชร์ข้อความ
    generateShareUrl(routeData) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            action: 'preview_route',
            students: routeData.students.length,
            distance: routeData.totalDistance.toFixed(1),
            time: routeData.estimatedTime,
            mode: routeData.travelMode || 'driving',
            timestamp: Date.now()
        });
        
        return `${baseUrl}?${params.toString()}`;
    },
    
    // แชร์ผ่านระบบ Native Share (มือถือ)
    async shareViaWebShare(routeData) {
        if (!navigator.share) {
            throw new Error('Web Share API not supported');
        }
        
        const shareData = {
            title: `แผนการเยี่ยมบ้าน ${routeData.students.length} ครัวเรือน`,
            text: this.generateRouteText(routeData),
            url: this.generateShareUrl(routeData)
        };
        
        try {
            await navigator.share(shareData);
            this.showMessage('แชร์เรียบร้อยแล้ว', 'success');
            this.trackShareEvent(routeData);
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }
    },
    
    // แชร์หลายช่องทาง
    async shareMultiChannel(routeData) {
        const options = [];
        
        // LINE (หลัก)
        if (this.isLiffReady && liff.isLoggedIn()) {
            options.push({
                name: 'LINE',
                icon: 'fab fa-line',
                color: '#06C755',
                action: () => this.shareFlexMessage(routeData)
            });
        }
        
        // Web Share API (มือถือ)
        if (navigator.share) {
            options.push({
                name: 'แชร์อื่นๆ',
                icon: 'fas fa-share-alt',
                color: '#007bff',
                action: () => this.shareViaWebShare(routeData)
            });
        }
        
        // Clipboard (สำรอง)
        options.push({
            name: 'คัดลอก',
            icon: 'fas fa-copy',
            color: '#6c757d',
            action: () => this.copyRouteToClipboard(routeData)
        });
        
        // แสดงตัวเลือก
        this.showShareOptions(options);
    },
    
    // แสดงตัวเลือกการแชร์
    showShareOptions(options) {
        // ลบ modal เก่า (ถ้ามี)
        const existingModal = document.getElementById('shareOptionsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = `
            <div class="modal fade" id="shareOptionsModal" tabindex="-1">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-share"></i> เลือกการแชร์
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-grid gap-2">
                                ${options.map(option => `
                                    <button class="btn btn-outline-primary" onclick="${option.action.toString()}()" data-bs-dismiss="modal">
                                        <i class="${option.icon}" style="color: ${option.color};"></i>
                                        ${option.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('shareOptionsModal'));
        modal.show();
    },
    
    // ตรวจสอบสภาพแวดล้อม
    detectEnvironment() {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLiffBrowser = navigator.userAgent.includes('Line');
        const hasWebShare = 'share' in navigator;
        const hasClipboard = 'clipboard' in navigator;
        
        return {
            isMobile,
            isLiffBrowser,
            hasWebShare,
            hasClipboard,
            platform: this.getPlatform()
        };
    },
    
    // หาแพลตฟอร์ม
    getPlatform() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            return 'iOS';
        } else if (userAgent.includes('Android')) {
            return 'Android';
        } else if (userAgent.includes('Windows')) {
            return 'Windows';
        } else if (userAgent.includes('Mac')) {
            return 'macOS';
        } else if (userAgent.includes('Linux')) {
            return 'Linux';
        } else {
            return 'Unknown';
        }
    },
    
    // เพิ่มปุ่ม Floating Action Button
    addFloatingShareButton() {
        // ลบปุ่มเก่า (ถ้ามี)
        const existingFab = document.getElementById('shareRouteFab');
        if (existingFab) {
            existingFab.remove();
        }
        
        const fab = document.createElement('button');
        fab.id = 'shareRouteFab';
        fab.className = 'share-fab pulse';
        fab.innerHTML = '<i class="fab fa-line"></i>';
        fab.title = 'แชร์เส้นทาง LINE';
        fab.style.display = 'none';
        
        fab.addEventListener('click', () => {
            if (window.routeData) {
                this.shareToLine(window.routeData);
            } else {
                this.showMessage('ไม่พบข้อมูลเส้นทาง', 'error');
            }
        });
        
        document.body.appendChild(fab);
        
        // แสดงปุ่มหลังจาก 2 วินาที
        setTimeout(() => {
            fab.style.display = 'flex';
        }, 2000);
    },
    
    // แสดง Progress Bar
    showProgress() {
        let progressEl = document.getElementById('shareProgress');
        
        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.id = 'shareProgress';
            progressEl.className = 'share-progress';
            progressEl.innerHTML = '<div class="share-progress-bar"></div>';
            document.body.appendChild(progressEl);
        }
        
        progressEl.classList.add('active');
        
        // ซ่อนหลัง 2 วินาที
        setTimeout(() => {
            progressEl.classList.remove('active');
        }, 2000);
    },
    
    // สร้างรายงานการใช้งาน
    generateUsageReport() {
        const stats = this.getShareStatistics();
        const env = this.detectEnvironment();
        
        const report = {
            reportDate: new Date().toISOString(),
            environment: env,
            statistics: stats,
            insights: {
                efficiency: this.calculateEfficiency(),
                trends: this.analyzeTrends(),
                recommendations: this.generateRecommendations(stats)
            }
        };
        
        return report;
    },
    
    // คำนวณประสิทธิภาพ
    calculateEfficiency() {
        if (this.shareHistory.length === 0) return 0;
        
        const avgTime = this.shareHistory.reduce((sum, share) => sum + share.estimatedTime, 0) / this.shareHistory.length;
        const avgDistance = this.shareHistory.reduce((sum, share) => sum + share.totalDistance, 0) / this.shareHistory.length;
        const avgStudents = this.shareHistory.reduce((sum, share) => sum + share.studentsCount, 0) / this.shareHistory.length;
        
        // ประสิทธิภาพ = นักเรียนต่อชั่วโมง
        return avgStudents / (avgTime / 60);
    },
    
    // วิเคราะห์แนวโน้ม
    analyzeTrends() {
        if (this.shareHistory.length < 2) return {};
        
        const recent = this.shareHistory.slice(-10);
        const older = this.shareHistory.slice(-20, -10);
        
        if (older.length === 0) return {};
        
        const recentAvgStudents = recent.reduce((sum, s) => sum + s.studentsCount, 0) / recent.length;
        const olderAvgStudents = older.reduce((sum, s) => sum + s.studentsCount, 0) / older.length;
        
        return {
            studentsPerRoute: recentAvgStudents > olderAvgStudents ? 'เพิ่มขึ้น' : 'ลดลง',
            changePercent: ((recentAvgStudents - olderAvgStudents) / olderAvgStudents * 100).toFixed(1)
        };
    },
    
    // สร้างคำแนะนำ
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.avgStudents < 5) {
            recommendations.push('ควรเพิ่มจำนวนนักเรียนต่อเส้นทางเพื่อประสิทธิภาพที่ดีขึ้น');
        }
        
        if (stats.avgDistance > 20) {
            recommendations.push('ระยะทางยาวเกินไป ควรแบ่งเป็นหลายเส้นทาง');
        }
        
        if (stats.mostPopularTravelMode === 'ขับรถ' && stats.avgDistance < 5) {
            recommendations.push('ระยะทางสั้น พิจารณาใช้จักรยานเพื่อความยั่งยืน');
        }
        
        return recommendations;
    },
    
    // Debug functions
    debugInfo() {
        return {
            isLiffReady: this.isLiffReady,
            shareHistoryCount: this.shareHistory.length,
            environment: this.detectEnvironment(),
            statistics: this.getShareStatistics(),
            lastError: this.lastError || null
        };
    },
    
    // Error logging
    logError(error, context = '') {
        this.lastError = {
            error: error.message,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        console.error(`❌ RouteShare Error [${context}]:`, error);
    }
};

// Global functions สำหรับใช้ใน HTML
window.shareRouteToLine = function(routeData = null) {
    const data = routeData || window.routeData;
    if (data) {
        RouteShare.shareToLine(data);
    } else {
        RouteShare.showMessage('ไม่พบข้อมูลเส้นทาง', 'error');
    }
};

window.initializeRouteShare = function() {
    RouteShare.init();
};

// Export สำหรับใช้งานในหน้าอื่น
if (typeof window !== 'undefined') {
    window.RouteShare = RouteShare;
}

// Auto-initialize เมื่อ DOM โหลดเสร็จ
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            RouteShare.init();
            
            // เพิ่ม FAB ถ้าอยู่ในหน้า preview
            if (window.location.search.includes('preview') || document.title.includes('แผนการเยี่ยม')) {
                setTimeout(() => {
                    RouteShare.addFloatingShareButton();
                }, 3000);
            }
        });
    } else {
        RouteShare.init();
    }
}

// Handle errors globally
window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('route-share')) {
        RouteShare.logError(event.error, 'Global Error Handler');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.stack && event.reason.stack.includes('RouteShare')) {
        RouteShare.logError(event.reason, 'Unhandled Promise Rejection');
    }
});

console.log('📱 RouteShare module loaded successfully - Version 1.0.0');

// แก้ไขและเพิ่มฟังก์ชันใน features/route-share.js

// เพิ่มฟังก์ชันทดสอบการแชร์
RouteShare.testShare = async function() {
    console.log('🧪 Testing share functionality...');
    
    // ข้อมูลทดสอบ
    const testData = {
        students: [
            { name: 'นาย ทดสอบ หนึ่ง', classroom: 'ม.1/1' },
            { name: 'นาง ทดสอบ สอง', classroom: 'ม.1/2' }
        ],
        totalDistance: 5.2,
        estimatedTime: 90,
        travelMode: '🚗 ขับรถ',
        googleMapsUrl: 'https://maps.google.com/test'
    };
    
    console.log('📋 Test data:', testData);
    
    // ทดสอบการสร้าง Flex Message
    try {
        const flexMessage = this.createSimpleFlexMessage(testData);
        console.log('✅ Flex Message created:', flexMessage);
        
        // ทดสอบการแชร์
        if (this.isLiffReady && liff.isLoggedIn()) {
            await liff.shareTargetPicker([flexMessage]);
            this.showMessage('ทดสอบแชร์สำเร็จ! 🎉', 'success');
        } else {
            console.warn('⚠️ LIFF not ready or not logged in');
            this.showMessage('LIFF ไม่พร้อม - ทดสอบด้วยข้อความแทน', 'error');
            await this.copyRouteToClipboard(testData);
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
        this.showMessage('ทดสอบล้มเหลว: ' + error.message, 'error');
    }
};

// ฟังก์ชัน Flex Message แบบง่าย (สำหรับทดสอบ)
RouteShare.createSimpleFlexMessage = function(routeData) {
    return {
        type: "flex",
        altText: `เส้นทางเยี่ยมบ้าน ${routeData.students.length} ครัวเรือน`,
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "🏠 เส้นทางเยี่ยมบ้าน",
                        weight: "bold",
                        size: "lg",
                        color: "#1a73e8"
                    },
                    {
                        type: "separator",
                        margin: "md"
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: "👥 ครัวเรือน:",
                                flex: 3,
                                size: "sm",
                                color: "#666666"
                            },
                            {
                                type: "text",
                                text: `${routeData.students.length} ครัวเรือน`,
                                flex: 4,
                                size: "sm",
                                weight: "bold"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        contents: [
                            {
                                type: "text",
                                text: "📏 ระยะทาง:",
                                flex: 3,
                                size: "sm",
                                color: "#666666"
                            },
                            {
                                type: "text",
                                text: `${routeData.totalDistance} กม.`,
                                flex: 4,
                                size: "sm",
                                weight: "bold"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        contents: [
                            {
                                type: "text",
                                text: "⏱️ เวลา:",
                                flex: 3,
                                size: "sm",
                                color: "#666666"
                            },
                            {
                                type: "text",
                                text: `${Math.floor(routeData.estimatedTime / 60)}:${String(routeData.estimatedTime % 60).padStart(2, '0')} ชม.`,
                                flex: 4,
                                size: "sm",
                                weight: "bold"
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
                        type: "button",
                        style: "primary",
                        action: {
                            type: "uri",
                            label: "🗺️ เปิด Google Maps",
                            uri: routeData.googleMapsUrl
                        }
                    }
                ]
            }
        }
    };
};

// ปรับปรุงฟังก์ชัน shareToLine ให้มี debug มากขึ้น
RouteShare.shareToLine = async function(routeData) {
    console.log('📤 Starting LINE share process...');
    console.log('📋 Route data received:', routeData);
    
    // ตรวจสอบ LIFF status
    console.log('🔗 LIFF Status:');
    console.log('  - LIFF SDK loaded:', typeof liff !== 'undefined');
    console.log('  - LIFF ready:', this.isLiffReady);
    console.log('  - LIFF logged in:', this.isLiffReady ? liff.isLoggedIn() : false);
    
    if (!this.validateRouteData(routeData)) {
        this.showMessage('ข้อมูลเส้นทางไม่ถูกต้อง', 'error');
        console.error('❌ Invalid route data:', routeData);
        return;
    }
    
    // แสดง loading
    this.setShareButtonLoading(true);
    
    try {
        if (this.isLiffReady && liff.isLoggedIn()) {
            console.log('✅ LIFF ready - attempting Flex Message share');
            await this.shareFlexMessageWithDebug(routeData);
        } else {
            console.log('⚠️ LIFF not ready - falling back to clipboard');
            await this.copyRouteToClipboard(routeData);
        }
    } catch (error) {
        console.error('❌ Share failed:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            type: error.type,
            stack: error.stack
        });
        
        // แสดงข้อผิดพลาดที่เข้าใจง่าย
        let userMessage = 'การแชร์ล้มเหลว';
        if (error.type === 'CANCEL') {
            userMessage = 'ยกเลิกการแชร์';
        } else if (error.message.includes('shareTargetPicker')) {
            userMessage = 'ไม่สามารถเปิดหน้าแชร์ได้ กรุณาลองใหม่';
        } else if (error.message.includes('permission')) {
            userMessage = 'ไม่มีสิทธิ์แชร์ กรุณาเข้าสู่ระบบ LINE';
        }
        
        this.showMessage(userMessage, 'error');
        
        // ลองแชร์แบบข้อความแทน
        console.log('🔄 Attempting fallback to text share...');
        try {
            await this.copyRouteToClipboard(routeData);
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
        }
    } finally {
        this.setShareButtonLoading(false);
    }
};

// ฟังก์ชันแชร์ Flex Message พร้อม debug
RouteShare.shareFlexMessageWithDebug = async function(routeData) {
    console.log('📱 Creating Flex Message with debug...');
    
    try {
        // สร้าง Flex Message แบบง่ายก่อน
        const flexMessage = this.createSimpleFlexMessage(routeData);
        console.log('✅ Simple Flex Message created:', JSON.stringify(flexMessage, null, 2));
        
        // ทดสอบการแชร์
        console.log('🚀 Attempting to share via LIFF...');
        await liff.shareTargetPicker([flexMessage]);
        
        console.log('✅ Share successful!');
        this.showMessage('แชร์เส้นทางเรียบร้อยแล้ว! 🎉', 'success');
        this.trackShareEvent(routeData);
        
    } catch (error) {
        console.error('❌ Flex Message share failed:', error);
        
        // ลองใช้ Flex Message แบบซับซ้อน
        if (error.message.includes('flex')) {
            console.log('🔄 Trying with complex Flex Message...');
            try {
                const complexFlex = this.selectFlexMessageType(routeData);
                await liff.shareTargetPicker([complexFlex]);
                this.showMessage('แชร์เส้นทางเรียบร้อยแล้ว! 🎉', 'success');
                this.trackShareEvent(routeData);
            } catch (complexError) {
                console.error('❌ Complex Flex Message also failed:', complexError);
                throw complexError;
            }
        } else {
            throw error;
        }
    }
};

// ฟังก์ชันตรวจสอบ LIFF และแก้ไข
RouteShare.checkAndFixLiff = async function() {
    console.log('🔧 Checking and fixing LIFF...');
    
    if (typeof liff === 'undefined') {
        console.error('❌ LIFF SDK not loaded');
        this.showMessage('LIFF SDK ไม่ถูกโหลด กรุณาโหลดหน้าใหม่', 'error');
        return false;
    }
    
    try {
        if (!liff.isInClient() && !liff.isLoggedIn()) {
            console.log('🔑 LIFF not logged in, attempting login...');
            await liff.login();
            return true;
        }
        
        if (!this.isLiffReady) {
            console.log('🔄 Re-initializing LIFF...');
            await this.initializeLiff();
        }
        
        console.log('✅ LIFF status check complete');
        return this.isLiffReady;
    } catch (error) {
        console.error('❌ LIFF check/fix failed:', error);
        this.showMessage('ไม่สามารถเชื่อมต่อ LINE ได้', 'error');
        return false;
    }
};

// ฟังก์ชันแชร์แบบ Universal (ลองทุกวิธี)
RouteShare.universalShare = async function(routeData) {
    console.log('🌐 Starting universal share...');
    
    const methods = [
        {
            name: 'LINE Flex Message',
            check: () => this.isLiffReady && liff.isLoggedIn(),
            action: () => this.shareFlexMessageWithDebug(routeData)
        },
        {
            name: 'Web Share API',
            check: () => navigator.share,
            action: () => this.shareViaWebShare(routeData)
        },
        {
            name: 'Clipboard',
            check: () => navigator.clipboard || document.execCommand,
            action: () => this.copyRouteToClipboard(routeData)
        }
    ];
    
    for (const method of methods) {
        console.log(`🧪 Trying method: ${method.name}`);
        
        if (method.check()) {
            try {
                await method.action();
                console.log(`✅ Success with method: ${method.name}`);
                return;
            } catch (error) {
                console.warn(`⚠️ Method ${method.name} failed:`, error);
            }
        } else {
            console.log(`❌ Method ${method.name} not available`);
        }
    }
    
    console.error('❌ All share methods failed');
    this.showMessage('ไม่สามารถแชร์ได้ด้วยวิธีใดๆ', 'error');
};

// เพิ่มปุ่มทดสอบ (สำหรับ debug)
RouteShare.addTestButton = function() {
    if (window.location.hostname !== 'localhost' && !window.location.search.includes('debug')) {
        return;
    }
    
    const testBtn = document.createElement('button');
    testBtn.innerHTML = '🧪 ทดสอบแชร์';
    testBtn.className = 'btn btn-warning btn-sm';
    testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999;';
    testBtn.onclick = () => {
        this.testShare();
    };
    
    document.body.appendChild(testBtn);
    
    // ปุ่มตรวจสอบ LIFF
    const liffBtn = document.createElement('button');
    liffBtn.innerHTML = '🔧 ตรวจสอบ LIFF';
    liffBtn.className = 'btn btn-info btn-sm';
    liffBtn.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 9999;';
    liffBtn.onclick = () => {
        this.checkAndFixLiff();
    };
    
    document.body.appendChild(liffBtn);
    
    // ปุ่มแชร์ Universal
    const universalBtn = document.createElement('button');
    universalBtn.innerHTML = '🌐 แชร์ Universal';
    universalBtn.className = 'btn btn-success btn-sm';
    universalBtn.style.cssText = 'position: fixed; top: 90px; right: 10px; z-index: 9999;';
    universalBtn.onclick = () => {
        if (window.routeData) {
            this.universalShare(window.routeData);
        } else {
            this.testShare();
        }
    };
    
    document.body.appendChild(universalBtn);
};

// อัปเดตฟังก์ชัน init เพื่อเพิ่มปุ่มทดสอบ
const originalInit = RouteShare.init;
RouteShare.init = async function() {
    await originalInit.call(this);
    
    // เพิ่มปุ่มทดสอบในโหมด debug
    setTimeout(() => {
        this.addTestButton();
    }, 1000);
    
    // แสดงสถานะ LIFF
    setTimeout(() => {
        console.log('📊 LIFF Status Report:');
        console.log('  - SDK Loaded:', typeof liff !== 'undefined');
        console.log('  - Is Ready:', this.isLiffReady);
        console.log('  - In Client:', typeof liff !== 'undefined' ? liff.isInClient() : false);
        console.log('  - Logged In:', this.isLiffReady ? liff.isLoggedIn() : false);
        console.log('  - User Agent:', navigator.userAgent);
    }, 2000);
};

// Global function สำหรับทดสอบในConsole
window.testFlexShare = function() {
    RouteShare.testShare();
};

window.checkLiffStatus = function() {
    console.log('🔍 LIFF Status Check:');
    console.log('SDK:', typeof liff !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');
    console.log('Ready:', RouteShare.isLiffReady ? '✅ Ready' : '❌ Not ready');
    console.log('In Client:', typeof liff !== 'undefined' ? (liff.isInClient() ? '✅ In LINE' : '❌ Not in LINE') : '❌ Unknown');
    console.log('Logged In:', RouteShare.isLiffReady ? (liff.isLoggedIn() ? '✅ Logged in' : '❌ Not logged in') : '❌ Unknown');
    
    return RouteShare.debugInfo();
};

window.fixLiff = function() {
    RouteShare.checkAndFixLiff();
};

console.log('🔧 Flex Message debug functions loaded!');