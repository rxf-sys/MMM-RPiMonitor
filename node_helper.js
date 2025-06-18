/* node_helper.js */
const NodeHelper = require("node_helper");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
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
        });
    },

    getCPUTemperature: function() {
        return new Promise((resolve) => {
            fs.readFile("/sys/class/thermal/thermal_zone0/temp", "utf8", (err, data) => {
                if (err) {
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
            const startUsage = process.cpuUsage();
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const totalUsage = endUsage.user + endUsage.system;
                const percentage = (totalUsage / 1000 / 10); // Convert to percentage
                resolve(Math.min(100, percentage));
            }, 100);
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
            exec("df -B1 /", (error, stdout) => {
                if (error) {
                    resolve({ total: 0, used: 0, free: 0 });
                } else {
                    const lines = stdout.split("\n");
                    const data = lines[1].split(/\s+/);
                    resolve({
                        total: parseInt(data[1]),
                        used: parseInt(data[2]),
                        free: parseInt(data[3])
                    });
                }
            });
        });
    }
});