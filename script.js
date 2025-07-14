  $(document).ready(function() {
        $('#login-button').click(function() {
            liff.login();
        });

        $('#logout-button').click(function() {
            logout();
        });

        $('#share-button').click(function() {
            shareData();
        });

        $('#fullscreenButton').click(function() {
            toggleFullscreen();
        });

        $('#fontSizeButton').click(function() {
            toggleFontSize();
        });

        initializeLiff();
        loadElectricityData();
        loadWaterData();
        loadNewsData();

        setInterval(function() {
            loadElectricityData($('#semesterDropdown').val());
            loadWaterData($('#semesterDropdown').val());
        }, 30000); // Reload data every 30 seconds

        updateDateTime();
        setInterval(updateDateTime, 1000); // Update date and time every second
    });

    async function initializeLiff() {
        try {
            await liff.init({ liffId: '2005494853-ZDznGqqe' });
            if (liff.isLoggedIn()) {
                displayUserInfo();
                $('#login-button').hide(); // Hide login button after login
            }
        } catch (error) {
            console.error('LIFF initialization failed', error);
        }
    }

    async function displayUserInfo() {
        const profile = await liff.getProfile();
        $('#profile-name').text(profile.displayName);
        $('#profile-picture').attr('src', profile.pictureUrl).show();
        $('#logout-button').show();
        $('#share-button').show();
    }

    // ฟังก์ชันสำหรับโหลดข้อมูลแหล่งไฟฟ้า
function loadElectricityData(semester) {
    fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/แหล่งไฟฟ้า')
        .then(response => response.json())
        .then(data => {
            const selectedData = data.find(item => item['ปีการศึกษา'] === semester);
            if (!selectedData) return;

            // ฟังก์ชันช่วยในการแปลงข้อมูล - จัดการกับค่า undefined/null
            const parseValue = (value) => {
                if (value === undefined || value === null || value === '') {
                    return 0;
                }
                return parseInt(String(value).replace(/,/g, ''));
            };

            const totalStudents = parseValue(selectedData['รวม']);

            const electricityA = parseValue(selectedData['ไม่มีไฟฟ้า']);
            const electricityB = parseValue(selectedData['มีไฟฟ้า']);
            const electricityC = parseValue(selectedData['ไฟบ้านหรือมิเตอร์']);
            const electricityD = parseValue(selectedData['เครื่องปั่นไฟ/โซลาเซลล์']);
            const electricityE = parseValue(selectedData['ไฟต่อพ่วง/แบตเตอรี่']);

            // คำนวณเปอร์เซ็นต์ - ป้องกันการหารด้วย 0
            const calculatePercent = (value, total) => {
                if (total === 0) return '0.00';
                return ((value / total) * 100).toFixed(2);
            };

            const electricityPercentA = calculatePercent(electricityA, totalStudents);
            const electricityPercentB = calculatePercent(electricityB, totalStudents);
            const electricityPercentC = calculatePercent(electricityC, totalStudents);
            const electricityPercentD = calculatePercent(electricityD, totalStudents);
            const electricityPercentE = calculatePercent(electricityE, totalStudents);

            // อัพเดทข้อมูลใน DOM
            document.getElementById('electricityDataA').innerText = `${electricityA} (คน)`;
            document.getElementById('electricityPercentA').innerText = `${electricityPercentA}%`;
            document.getElementById('electricityDataB').innerText = `${electricityB} (คน)`;
            document.getElementById('electricityPercentB').innerText = `${electricityPercentB}%`;
            document.getElementById('electricityDataC').innerText = `${electricityC} (คน)`;
            document.getElementById('electricityPercentC').innerText = `${electricityPercentC}%`;
            document.getElementById('electricityDataD').innerText = `${electricityD} (คน)`;
            document.getElementById('electricityPercentD').innerText = `${electricityPercentD}%`;
            document.getElementById('electricityDataE').innerText = `${electricityE} (คน)`;
            document.getElementById('electricityPercentE').innerText = `${electricityPercentE}%`;
        })
        .catch(error => {
            console.error('Error loading electricity data:', error);
            // แสดงค่าเริ่มต้นเมื่อเกิด error
            document.getElementById('electricityDataA').innerText = '0 (คน)';
            document.getElementById('electricityPercentA').innerText = '0.00%';
            document.getElementById('electricityDataB').innerText = '0 (คน)';
            document.getElementById('electricityPercentB').innerText = '0.00%';
            document.getElementById('electricityDataC').innerText = '0 (คน)';
            document.getElementById('electricityPercentC').innerText = '0.00%';
            document.getElementById('electricityDataD').innerText = '0 (คน)';
            document.getElementById('electricityPercentD').innerText = '0.00%';
            document.getElementById('electricityDataE').innerText = '0 (คน)';
            document.getElementById('electricityPercentE').innerText = '0.00%';
        });
}

// ฟังก์ชันสำหรับโหลดข้อมูลแหล่งน้ำดื่ม
function loadWaterData(semester) {
    fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/แหล่งน้ำดื่ม')
        .then(response => response.json())
        .then(data => {
            const selectedData = data.find(item => item['ปีการศึกษา'] === semester);
            if (!selectedData) return;

            // ฟังก์ชันช่วยในการแปลงข้อมูล - จัดการกับค่า undefined/null
            const parseValue = (value) => {
                if (value === undefined || value === null || value === '') {
                    return 0;
                }
                return parseInt(String(value).replace(/,/g, ''));
            };

            const totalStudents = parseValue(selectedData['รวม']);

            const waterA = parseValue(selectedData['น้ำดื่มบรรจุขวด/ ตู้หยอดน้ำ']);
            const waterB = parseValue(selectedData['น้ำประปา']);
            const waterC = parseValue(selectedData['น้ำบ่อ/น้ำบาดาล']);
            const waterD = parseValue(selectedData['น้ำฝน/น้ำประปาภูเขา/ ลำธาร']);

            // คำนวณเปอร์เซ็นต์ - ป้องกันการหารด้วย 0
            const calculatePercent = (value, total) => {
                if (total === 0) return '0.00';
                return ((value / total) * 100).toFixed(2);
            };

            const waterPercentA = calculatePercent(waterA, totalStudents);
            const waterPercentB = calculatePercent(waterB, totalStudents);
            const waterPercentC = calculatePercent(waterC, totalStudents);
            const waterPercentD = calculatePercent(waterD, totalStudents);

            // อัพเดทข้อมูลใน DOM
            document.getElementById('waterDataA').innerText = `${waterA} (คน)`;
            document.getElementById('waterPercentA').innerText = `${waterPercentA}%`;
            document.getElementById('waterDataB').innerText = `${waterB} (คน)`;
            document.getElementById('waterPercentB').innerText = `${waterPercentB}%`;
            document.getElementById('waterDataC').innerText = `${waterC} (คน)`;
            document.getElementById('waterPercentC').innerText = `${waterPercentC}%`;
            document.getElementById('waterDataD').innerText = `${waterD} (คน)`;
            document.getElementById('waterPercentD').innerText = `${waterPercentD}%`;
      
            console.log('Water Data C:', $('#waterDataC').text());
            console.log('Water Percent C:', $('#waterPercentC').text());
        })
        .catch(error => {
            console.error('Error loading water data:', error);
            // แสดงค่าเริ่มต้นเมื่อเกิด error
            document.getElementById('waterDataA').innerText = '0 (คน)';
            document.getElementById('waterPercentA').innerText = '0.00%';
            document.getElementById('waterDataB').innerText = '0 (คน)';
            document.getElementById('waterPercentB').innerText = '0.00%';
            document.getElementById('waterDataC').innerText = '0 (คน)';
            document.getElementById('waterPercentC').innerText = '0.00%';
            document.getElementById('waterDataD').innerText = '0 (คน)';
            document.getElementById('waterPercentD').innerText = '0.00%';
        });
}

    function shareData() {
        const profilePicture = $('#profile-picture').attr('src');
        const profileName = $('#profile-name').text();
        const currentDateTime = new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            weekday: 'long',
            hour12: false
        });

              const electricityDataA = $('#electricityDataA').text();
              const electricityPercentA = $('#electricityPercentA').text();
              const electricityDataB = $('#electricityDataB').text();
              const electricityPercentB = $('#electricityPercentB').text();
              const electricityDataC = $('#electricityDataC').text();
              const electricityPercentC = $('#electricityPercentC').text();
              const electricityDataD = $('#electricityDataD').text();
              const electricityPercentD = $('#electricityPercentD').text();
              const electricityDataE = $('#electricityDataE').text();
              const electricityPercentE = $('#electricityPercentE').text();

              const waterDataA = $('#waterDataA').text();
              const waterPercentA = $('#waterPercentA').text();
              const waterDataB = $('#waterDataB').text();
              const waterPercentB = $('#waterPercentB').text();
              const waterDataC = $('#waterDataC').text();
              const waterPercentC = $('#waterPercentC').text();
              const waterDataD = $('#waterDataD').text();
              const waterPercentD = $('#waterPercentD').text();


        const flexMessage = {
            type: "flex",
            altText: "แหล่งน้ำดื่ม|แหล่งไฟฟ้า",
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
                            type: "separator",
                            margin: "xl"
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
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: $('#semesterDropdown').val(),
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "ไม่มีไฟฟ้า",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataA} (${electricityPercentA})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "มีไฟฟ้า",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataB} (${electricityPercentB})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "ไฟบ้านหรือมิเตอร์",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataC} (${electricityPercentC})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "เครื่องปั่นไฟ/โซลาเซลล์",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataD} (${electricityPercentD})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "ไฟต่อพ่วง/แบตเตอรี่",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataE} (${electricityPercentE})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                } 
                            ]
                        },
                        {
                            type: "separator",
                            margin: "xl"
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
                                            text: "น้ำดื่มบรรจุขวด/ ตู้หยอดน้ำ",
                                            wrap: true,
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataA} (${waterPercentA})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "น้ำประปา",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataB} (${waterPercentB})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "น้ำบ่อ/น้ำบาดาล",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataC} (${waterPercentC})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                                            text: "น้ำฝน/น้ำประปาภูเขา/ลำธาร",
                                           wrap: true,
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataD} (${waterPercentD})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
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
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "App เยี่ยมบ้าน",
                                uri: "https://liff.line.me/2005230346-ND61qqrg"
                            },
                            style: "primary",
                            color: "#1DB446",
                            margin: "md"
                        },
                        {
                            type: "button",
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "View More",
                                uri: "https://liff.line.me/2005494853-ZDznGqqe"
                            },
                            style: "primary",
                            color: "#1DB446",
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
                liff.closeWindow();
            })
            .catch(function (error) {
                console.error('Error sending message: ', error);
            });
    }

    function loadNewsData() {
        fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ข่าวประกาศ')
            .then(response => response.json())
            .then(data => {
                let newsHtml = data.map(news => {
                    let date = news.วันที่.replace(' +0700', ''); // ตัดข้อความ "+0000" ออก
                    return `📰 <a href="${news.Link}" target="_blank">${news.หัวข้อข่าว}: 📆 (${date})</a>`;
                }).join(' | ');
                $('#newsTicker').html(newsHtml);
            });
    }

    function logout() {
        liff.logout();
        window.location.reload();
    }

    function chatFunction() {
        window.open('https://line.me/R/ti/p/@747spikt', '_blank');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            $('#fullscreenButton').text('ย่อขนาดจอ');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                $('#fullscreenButton').text('ขยายเต็มจอ');
            }
        }
    }

    function toggleFontSize() {
        let currentSize = parseInt($('body').css('font-size'));
        if (currentSize === 16) {
            $('body').css('font-size', '20px');
        } else if (currentSize === 20) {
            $('body').css('font-size', '24px');
        } else {
            $('body').css('font-size', '16px');
        }
    }

    function updateDateTime() {
        const currentDateTime = new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            weekday: 'long',
            hour12: false
        });
        $('#currentDateTime').text(currentDateTime);
    }

