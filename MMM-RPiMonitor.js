/* MMM-RPiMonitor.js
 *
 * Magic Mirror Module: MMM-RPiMonitor
 * Version: 1.0.0
 *
 * By rxf-sys
 * MIT Licensed.
 */

Module.register("MMM-RPiMonitor", {
    // Default module config
    defaults: {
        updateInterval: 5000, // Update every 5 seconds
        units: "metric", // metric or imperial
        showCPUTemp: true,
        showGPUTemp: true,
        showCPUUsage: true,
        showRAMUsage: true,
        showDiskUsage: true,
        showUptime: true,
        showLoadAverage: true,
        animationSpeed: 300, // Faster animation for value updates
        tempWarning: 65, // Warning threshold in Celsius
        tempCritical: 80, // Critical threshold in Celsius
        diskWarning: 80, // Warning threshold in percent
        diskCritical: 90, // Critical threshold in percent
        cpuWarning: 80, // Warning threshold in percent
        cpuCritical: 95, // Critical threshold in percent
        ramWarning: 80, // Warning threshold in percent
        ramCritical: 95, // Critical threshold in percent
    },

    requiresVersion: "2.1.0",

    // Start the module
    start: function() {
        Log.info("Starting module: " + this.name);
        this.systemData = {};
        this.domCreated = false;
        this.dataElements = {};
        this.sendSocketNotification("START_MONITORING", this.config);
        this.scheduleUpdate();
    },

    // Override dom generator
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "rpi-monitor";

        if (Object.keys(this.systemData).length === 0) {
            wrapper.innerHTML = "Loading system data...";
            wrapper.className += " dimmed light small";
            return wrapper;
        }

        // Only create DOM structure once
        if (!this.domCreated) {
            this.createInitialDOM(wrapper);
            this.domCreated = true;
        } else {
            // If DOM is already created, just update values
            this.updateValues();
            // Return the existing wrapper
            return this.wrapper;
        }

        // Store wrapper reference for future updates
        this.wrapper = wrapper;
        return wrapper;
    },

    createInitialDOM: function(wrapper) {
        // Create header
        const header = document.createElement("header");
        header.className = "module-header";
        header.innerHTML = "🍓 Raspberry Pi Status";
        wrapper.appendChild(header);

        // Create main content container
        const content = document.createElement("div");
        content.className = "rpi-content";

        // CPU Section
        if (this.config.showCPUTemp || this.config.showCPUUsage) {
            const cpuSection = document.createElement("div");
            cpuSection.className = "rpi-section";

            const cpuTitle = document.createElement("div");
            cpuTitle.className = "section-title";
            cpuTitle.innerHTML = "💻 CPU";
            cpuSection.appendChild(cpuTitle);

            if (this.config.showCPUUsage) {
                const cpuUsageRow = this.createDataRowElement("Usage", "cpu-usage");
                cpuSection.appendChild(cpuUsageRow);
                this.dataElements["cpu-usage"] = cpuUsageRow.querySelector(".data-value");
            }

            if (this.config.showCPUTemp) {
                const cpuTempRow = this.createDataRowElement("Temperature", "cpu-temp");
                cpuSection.appendChild(cpuTempRow);
                this.dataElements["cpu-temp"] = cpuTempRow.querySelector(".data-value");
            }

            if (this.config.showLoadAverage) {
                const loadRow = this.createDataRowElement("Load Average", "load-avg");
                cpuSection.appendChild(loadRow);
                this.dataElements["load-avg"] = loadRow.querySelector(".data-value");
            }

            content.appendChild(cpuSection);
        }

        // GPU Section
        if (this.config.showGPUTemp) {
            const gpuSection = document.createElement("div");
            gpuSection.className = "rpi-section";

            const gpuTitle = document.createElement("div");
            gpuTitle.className = "section-title";
            gpuTitle.innerHTML = "🎮 GPU";
            gpuSection.appendChild(gpuTitle);

            const gpuTempRow = this.createDataRowElement("Temperature", "gpu-temp");
            gpuSection.appendChild(gpuTempRow);
            this.dataElements["gpu-temp"] = gpuTempRow.querySelector(".data-value");

            content.appendChild(gpuSection);
        }

        // Memory Section
        if (this.config.showRAMUsage) {
            const memSection = document.createElement("div");
            memSection.className = "rpi-section";

            const memTitle = document.createElement("div");
            memTitle.className = "section-title";
            memTitle.innerHTML = "🧠 Memory";
            memSection.appendChild(memTitle);

            const memUsageRow = this.createDataRowElement("Usage", "ram-usage");
            memSection.appendChild(memUsageRow);
            this.dataElements["ram-usage"] = memUsageRow.querySelector(".data-value");

            const memFreeRow = this.createDataRowElement("Free", "ram-free");
            memSection.appendChild(memFreeRow);
            this.dataElements["ram-free"] = memFreeRow.querySelector(".data-value");

            content.appendChild(memSection);
        }

        // Storage Section
        if (this.config.showDiskUsage) {
            const diskSection = document.createElement("div");
            diskSection.className = "rpi-section";

            const diskTitle = document.createElement("div");
            diskTitle.className = "section-title";
            diskTitle.innerHTML = "💾 Storage";
            diskSection.appendChild(diskTitle);

            const diskUsageRow = this.createDataRowElement("Usage", "disk-usage");
            diskSection.appendChild(diskUsageRow);
            this.dataElements["disk-usage"] = diskUsageRow.querySelector(".data-value");

            const diskFreeRow = this.createDataRowElement("Free", "disk-free");
            diskSection.appendChild(diskFreeRow);
            this.dataElements["disk-free"] = diskFreeRow.querySelector(".data-value");

            content.appendChild(diskSection);
        }

        // System Section
        if (this.config.showUptime) {
            const sysSection = document.createElement("div");
            sysSection.className = "rpi-section";

            const sysTitle = document.createElement("div");
            sysTitle.className = "section-title";
            sysTitle.innerHTML = "⏱️ System";
            sysSection.appendChild(sysTitle);

            const uptimeRow = this.createDataRowElement("Uptime", "uptime");
            sysSection.appendChild(uptimeRow);
            this.dataElements["uptime"] = uptimeRow.querySelector(".data-value");

            content.appendChild(sysSection);
        }

        wrapper.appendChild(content);

        // Initial value update
        this.updateValues();
    },

    createDataRowElement: function(label, className) {
        const row = document.createElement("div");
        row.className = "data-row " + className;

        const labelSpan = document.createElement("span");
        labelSpan.className = "data-label";
        labelSpan.innerHTML = label + ":";

        const valueSpan = document.createElement("span");
        valueSpan.className = "data-value";
        valueSpan.innerHTML = "N/A";

        row.appendChild(labelSpan);
        row.appendChild(valueSpan);

        return row;
    },

    updateValues: function() {
        // Update only the values, not the structure
        if (this.dataElements["cpu-usage"]) {
            this.dataElements["cpu-usage"].innerHTML = this.formatCPUUsage();
        }

        if (this.dataElements["cpu-temp"]) {
            this.dataElements["cpu-temp"].innerHTML = this.formatTemperature(this.systemData.cpuTemp);
        }

        if (this.dataElements["load-avg"]) {
            this.dataElements["load-avg"].innerHTML = this.formatLoadAverage();
        }

        if (this.dataElements["gpu-temp"]) {
            this.dataElements["gpu-temp"].innerHTML = this.formatTemperature(this.systemData.gpuTemp);
        }

        if (this.dataElements["ram-usage"]) {
            this.dataElements["ram-usage"].innerHTML = this.formatMemoryUsage();
        }

        if (this.dataElements["ram-free"]) {
            this.dataElements["ram-free"].innerHTML = this.formatBytes(this.systemData.memFree);
        }

        if (this.dataElements["disk-usage"]) {
            this.dataElements["disk-usage"].innerHTML = this.formatDiskUsage();
        }

        if (this.dataElements["disk-free"]) {
            this.dataElements["disk-free"].innerHTML = this.formatBytes(this.systemData.diskFree);
        }

        if (this.dataElements["uptime"]) {
            this.dataElements["uptime"].innerHTML = this.formatUptime();
        }
    },

    // Formatting functions
    formatTemperature: function(temp) {
        if (!temp) return "N/A";
        const tempUnit = this.config.units === "imperial" ? "°F" : "°C";
        const temperature = this.config.units === "imperial" ? (temp * 9/5) + 32 : temp;
        const status = this.getTemperatureStatus(temp);
        return `<span class="${status}">${temperature.toFixed(1)}${tempUnit}</span>`;
    },

    formatCPUUsage: function() {
        if (!this.systemData.cpuUsage && this.systemData.cpuUsage !== 0) return "N/A";
        const usage = this.systemData.cpuUsage.toFixed(1);
        const status = this.getCPUStatus(this.systemData.cpuUsage);
        return `<span class="${status}">${usage}%</span>`;
    },

    formatMemoryUsage: function() {
        if (!this.systemData.memUsed || !this.systemData.memTotal) return "N/A";
        const percentage = ((this.systemData.memUsed / this.systemData.memTotal) * 100);
        const status = this.getRAMStatus(percentage);
        return `<span class="${status}">${percentage.toFixed(1)}% (${this.formatBytes(this.systemData.memUsed)})</span>`;
    },

    formatDiskUsage: function() {
        if (!this.systemData.diskUsed || !this.systemData.diskTotal) return "N/A";
        const percentage = ((this.systemData.diskUsed / this.systemData.diskTotal) * 100);
        const status = this.getDiskStatus(percentage);
        return `<span class="${status}">${percentage.toFixed(1)}% (${this.formatBytes(this.systemData.diskUsed)})</span>`;
    },

    formatLoadAverage: function() {
        if (!this.systemData.loadAverage) return "N/A";
        return this.systemData.loadAverage.map(load => load.toFixed(2)).join(", ");
    },

    formatUptime: function() {
        if (!this.systemData.uptime) return "N/A";
        const days = Math.floor(this.systemData.uptime / 86400);
        const hours = Math.floor((this.systemData.uptime % 86400) / 3600);
        const minutes = Math.floor((this.systemData.uptime % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    },

    formatBytes: function(bytes) {
        if (!bytes) return "0 B";
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    },

    // Status functions
    getTemperatureStatus: function(temp) {
        if (temp >= this.config.tempCritical) return "critical";
        if (temp >= this.config.tempWarning) return "warning";
        return "normal";
    },

    getCPUStatus: function(usage) {
        if (usage >= this.config.cpuCritical) return "critical";
        if (usage >= this.config.cpuWarning) return "warning";
        return "normal";
    },

    getRAMStatus: function(percentage) {
        if (percentage >= this.config.ramCritical) return "critical";
        if (percentage >= this.config.ramWarning) return "warning";
        return "normal";
    },

    getDiskStatus: function(percentage) {
        if (percentage >= this.config.diskCritical) return "critical";
        if (percentage >= this.config.diskWarning) return "warning";
        return "normal";
    },

    // Schedule next update
    scheduleUpdate: function() {
        var self = this;
        setInterval(function() {
            self.sendSocketNotification("GET_SYSTEM_DATA");
        }, this.config.updateInterval);
    },

    // Handle notifications from node_helper
    socketNotificationReceived: function(notification, payload) {
        if (notification === "SYSTEM_DATA") {
            this.systemData = payload;

            if (this.domCreated) {
                // If DOM is already created, only update values
                this.updateValues();
            } else {
                // First time, create the full DOM
                this.updateDom(this.config.animationSpeed);
            }
        }
    },

    // Load CSS
    getStyles: function() {
        return ["MMM-RPiMonitor.css"];
    }
});
