/* node_helper.js */
const NodeHelper = require("node_helper");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.lastCPUInfo = null;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "START_MONITORING") {
            this.config = payload;
            this.getSystemData();
        } else if (notification === "GET_SYSTEM_DATA") {
            this.getSystemData();
        }
    },

    getSystemData: function() {
        var self = this;
        var systemData = {};

        // Get CPU temperature
        this.getCPUTemperature().then(temp => {
            systemData.cpuTemp = temp;

            // Get GPU temperature
            return this.getGPUTemperature();
        }).then(temp => {
            systemData.gpuTemp = temp;

            // Get CPU usage
            return this.getCPUUsage();
        }).then(usage => {
            systemData.cpuUsage = usage;

            // Get memory info
            const memInfo = this.getMemoryInfo();
            systemData.memTotal = memInfo.total;
            systemData.memUsed = memInfo.used;
            systemData.memFree = memInfo.free;

            // Get disk info
            return this.getDiskInfo();
        }).then(diskInfo => {
            systemData.diskTotal = diskInfo.total;
            systemData.diskUsed = diskInfo.used;
            systemData.diskFree = diskInfo.free;

            // Get load average
            systemData.loadAverage = os.loadavg();

            // Get uptime
            systemData.uptime = os.uptime();

            // Send data to frontend
            self.sendSocketNotification("SYSTEM_DATA", systemData);
        }).catch(error => {
            console.error("Error getting system data:", error);
            // Send partial data even if some operations fail
            self.sendSocketNotification("SYSTEM_DATA", systemData);
        });
    },

    getCPUTemperature: function() {
        return new Promise((resolve) => {
            fs.readFile("/sys/class/thermal/thermal_zone0/temp", "utf8", (err, data) => {
                if (err) {
                    console.log("CPU temp read error:", err);
                    resolve(null);
                } else {
                    resolve(parseInt(data) / 1000);
                }
            });
        });
    },

    getGPUTemperature: function() {
        return new Promise((resolve) => {
            exec("vcgencmd measure_temp", (error, stdout) => {
                if (error) {
                    console.log("GPU temp error:", error);
                    resolve(null);
                } else {
                    const match = stdout.match(/temp=([0-9.]+)/);
                    resolve(match ? parseFloat(match[1]) : null);
                }
            });
        });
    },

    getCPUUsage: function() {
        return new Promise((resolve) => {
            // Read CPU info from /proc/stat
            fs.readFile("/proc/stat", "utf8", (err, data) => {
                if (err) {
                    console.log("CPU usage read error:", err);
                    resolve(null);
                    return;
                }

                const lines = data.split("\n");
                const cpuLine = lines[0];
                const cpuInfo = cpuLine.split(/\s+/);

                const idle = parseInt(cpuInfo[4]);
                const total = cpuInfo.slice(1, 8).reduce((acc, val) => acc + parseInt(val), 0);

                if (this.lastCPUInfo) {
                    const idleDelta = idle - this.lastCPUInfo.idle;
                    const totalDelta = total - this.lastCPUInfo.total;
                    const usage = 100 - (100 * idleDelta / totalDelta);

                    this.lastCPUInfo = { idle, total };
                    resolve(Math.max(0, Math.min(100, usage)));
                } else {
                    this.lastCPUInfo = { idle, total };
                    // First run, can't calculate usage yet
                    setTimeout(() => this.getCPUUsage().then(resolve), 1000);
                }
            });
        });
    },

    getMemoryInfo: function() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;

        return {
            total: total,
            used: used,
            free: free
        };
    },

    getDiskInfo: function() {
        return new Promise((resolve) => {
            exec("df -B1 / | grep -v Filesystem", (error, stdout) => {
                if (error) {
                    console.log("Disk info error:", error);
                    resolve({ total: 0, used: 0, free: 0 });
                } else {
                    try {
                        // Remove extra spaces and split
                        const data = stdout.trim().split(/\s+/);
                        console.log("Disk info raw data:", data);

                        // df output format: Filesystem 1B-blocks Used Available Use% Mounted
                        resolve({
                            total: parseInt(data[1]) || 0,
                            used: parseInt(data[2]) || 0,
                            free: parseInt(data[3]) || 0
                        });
                    } catch (parseError) {
                        console.log("Disk info parse error:", parseError);
                        resolve({ total: 0, used: 0, free: 0 });
                    }
                }
            });
        });
    }
});
