# MMM-RPiMonitor

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/) smart mirror project.

This module displays live system statistics from your Raspberry Pi including CPU usage, temperature, memory usage, disk space, and system uptime. Perfect for monitoring your Mirror's performance at a glance.

## Screenshot

![MMM-RPiMonitor Screenshot](screenshot.png)

## Features

- Real-time CPU and GPU temperature monitoring
- CPU usage percentage with color-coded warnings
- RAM usage and free memory display
- Disk usage statistics
- System uptime
- Load average display
- Smooth animations and transitions
- Configurable update intervals
- Visual alerts for critical values

## Installation

1. Navigate to your MagicMirror's `modules` folder:
```bash
cd ~/MagicMirror/modules/
```

2. Clone this repository:
```bash
git clone https://github.com/rxf-sys/MMM-RPiMonitor.git
```

3. Navigate to the module folder:
```bash
cd MMM-RPiMonitor
```

4. Install the dependencies:
```bash
npm install
```

## Using the module

To use this module, add the following configuration block to the modules array in the `config/config.js` file:

```js
{
    module: "MMM-RPiMonitor",
    position: "top_right",
    config: {
        // See below for configurable options
    }
}
```

## Configuration options

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `updateInterval` | How often to update the data (in milliseconds) | Integer | `5000` |
| `units` | Temperature units (`"metric"` for Celsius, `"imperial"` for Fahrenheit) | String | `"metric"` |
| `showCPUTemp` | Show CPU temperature | Boolean | `true` |
| `showGPUTemp` | Show GPU temperature | Boolean | `true` |
| `showCPUUsage` | Show CPU usage percentage | Boolean | `true` |
| `showRAMUsage` | Show RAM usage | Boolean | `true` |
| `showDiskUsage` | Show disk usage | Boolean | `true` |
| `showUptime` | Show system uptime | Boolean | `true` |
| `showLoadAverage` | Show system load average | Boolean | `true` |
| `animationSpeed` | Speed of animations in milliseconds | Integer | `300` |
| `tempWarning` | Temperature warning threshold (°C) | Integer | `65` |
| `tempCritical` | Temperature critical threshold (°C) | Integer | `80` |
| `cpuWarning` | CPU usage warning threshold (%) | Integer | `80` |
| `cpuCritical` | CPU usage critical threshold (%) | Integer | `95` |
| `ramWarning` | RAM usage warning threshold (%) | Integer | `80` |
| `ramCritical` | RAM usage critical threshold (%) | Integer | `95` |
| `diskWarning` | Disk usage warning threshold (%) | Integer | `80` |
| `diskCritical` | Disk usage critical threshold (%) | Integer | `90` |

### Example configuration

```js
{
    module: "MMM-RPiMonitor",
    position: "top_right",
    config: {
        updateInterval: 10000, // Update every 10 seconds
        units: "metric",
        showGPUTemp: false, // Hide GPU temperature
        tempWarning: 60,
        tempCritical: 75,
        animationSpeed: 500
    }
}
```

## Styling

The module comes with default styling that integrates well with the MagicMirror interface. The following CSS classes are available for customization:

- `.rpi-monitor` - Main container
- `.module-header` - Module header
- `.rpi-section` - Each data section
- `.data-row` - Individual data rows
- `.data-value` - Value displays
- `.normal` - Normal status (green)
- `.warning` - Warning status (orange)
- `.critical` - Critical status (red, pulsing)

### Custom CSS Example

Add to your `custom.css` file:

```css
.MMM-RPiMonitor .module-header {
    color: #ff6b6b;
    font-size: 20px;
}

.MMM-RPiMonitor .rpi-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Troubleshooting

### Values showing "N/A"

1. **CPU Temperature**: Check if `/sys/class/thermal/thermal_zone0/temp` exists and is readable
2. **GPU Temperature**: Ensure `vcgencmd` is available (Raspberry Pi specific)
3. **Disk Usage**: Verify the module has permission to execute `df` command

### High CPU Usage

The module reads from `/proc/stat` for accurate CPU measurements. If you experience issues:
- Increase the `updateInterval` to reduce polling frequency
- Check system logs: `pm2 logs mm`

### No Data Display

Check the MagicMirror logs:
```bash
cd ~/MagicMirror
npm start dev
```

## Dependencies

- [fs](https://nodejs.org/api/fs.html) (built-in)
- [os](https://nodejs.org/api/os.html) (built-in)
- [child_process](https://nodejs.org/api/child_process.html) (built-in)

## Known Issues

- GPU temperature only works on Raspberry Pi with `vcgencmd` available
- Some values may require elevated permissions on certain systems

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MagicMirror²](https://github.com/MichMich/MagicMirror/) community
- Icons from the standard emoji set
- Inspired by various system monitoring tools

## Author

**Your Name**
- GitHub: [@rxf-sys](https://github.com/rxf-sys)

## Version History

### 1.0.0 - Initial Release
- Real-time system monitoring
- Temperature, CPU, RAM, and disk monitoring
- Configurable thresholds and warnings
- Smooth animations without flickering