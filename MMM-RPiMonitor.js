/* MMM-RPiMonitor.js
 * 
 * Magic Mirror Module: MMM-RPiMonitor
 * Version: 1.0.0
 * 
 * By YourName
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
        animationSpeed: 1000,
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
            const cpuSection = this.createSection("💻 CPU", [
                this.config.showCPUUsage ? this.createDataRow("Usage", this.formatCPUUsage(), "cpu-usage") : null,
                this.config.showCPUTemp ? this.createDataRow("Temperature", this.formatTemperature(this.systemData.cpuTemp), "cpu-temp") : null,
                this.config.showLoadAverage ? this.createDataRow("Load Average", this.formatLoadAverage(), "load-avg") : null
            ].filter(row => row !== null));
            content.appendChild(cpuSection);
        }

        // GPU Section
        if (this.config.showGPUTemp && this.systemData.gpuTemp) {
            const gpuSection = this.createSection("🎮 GPU", [
                this.createDataRow("Temperature", this.formatTemperature(this.systemData.gpuTemp), "gpu-temp")
            ]);
            content.appendChild(gpuSection);
        }

        // Memory Section
        if (this.config.showRAMUsage) {
            const memSection = this.createSection("🧠 Memory", [
                this.createDataRow("Usage", this.formatMemoryUsage(), "ram-usage"),
                this.createDataRow("Free", this.formatBytes(this.systemData.memFree), "ram-free")
            ]);
            content.appendChild(memSection);
        }

        // Storage Section
        if (this.config.showDiskUsage) {
            const diskSection = this.createSection("💾 Storage", [
                this.createDataRow("Usage", this.formatDiskUsage(), "disk-usage"),
                this.createDataRow("Free", this.formatBytes(this.systemData.diskFree), "disk-free")
            ]);
            content.appendChild(diskSection);
        }

        // System Section
        if (this.config.showUptime) {
            const sysSection = this.createSection("⏱️ System", [
                this.createDataRow("Uptime", this.formatUptime(), "uptime")
            ]);
            content.appendChild(sysSection);
        }

        wrapper.appendChild(content);
        return wrapper;
    },

    // Create a section with title and data rows
    createSection: function(title, rows) {
        const section = document.createElement("div");
        section.className = "rpi-section";

        const sectionTitle = document.createElement("div");
        sectionTitle.className = "section-title";
        sectionTitle.innerHTML = title;
        section.appendChild(sectionTitle);

        rows.forEach(row => {
            if (row) section.appendChild(row);
        });

        return section;
    },

    // Create a data row with label and value
    createDataRow: function(label, value, className) {
        const row = document.createElement("div");
        row.className = "data-row " + className;

        const labelSpan = document.createElement("span");
        labelSpan.className = "data-label";
        labelSpan.innerHTML = label + ":";

        const valueSpan = document.createElement("span");
        valueSpan.className = "data-value";
        valueSpan.innerHTML = value;

        row.appendChild(labelSpan);
        row.appendChild(valueSpan);

        return row;
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
        if (!this.systemData.cpuUsage) return "N/A";
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
            this.updateDom(this.config.animationSpeed);
        }
    },

    // Load CSS
    getStyles: function() {
        return ["MMM-RPiMonitor.css"];
    }
});