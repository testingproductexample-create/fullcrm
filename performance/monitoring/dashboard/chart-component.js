const express = require('express');
const path = require('path');

class ChartComponent {
    constructor(canvasId, config = {}) {
        this.canvasId = canvasId;
        this.config = {
            type: config.type || 'line',
            responsive: config.responsive !== false,
            maintainAspectRatio: config.maintainAspectRatio || false,
            animation: config.animation !== false,
            plugins: {
                legend: {
                    display: config.showLegend !== false,
                    position: config.legendPosition || 'top'
                },
                tooltip: {
                    enabled: config.showTooltips !== false
                }
            },
            ...config
        };
        this.chart = null;
        this.data = [];
    }

    // Initialize chart
    async init() {
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js library not loaded');
        }

        const ctx = document.getElementById(this.canvasId);
        if (!ctx) {
            throw new Error(`Canvas element with id '${this.canvasId}' not found`);
        }

        this.chart = new Chart(ctx, {
            type: this.config.type,
            data: {
                labels: [],
                datasets: []
            },
            options: this.config
        });

        return this;
    }

    // Update chart data
    update(data) {
        if (!this.chart) {
            throw new Error('Chart not initialized');
        }

        this.data = data;
        
        if (data.labels) {
            this.chart.data.labels = data.labels;
        }

        if (data.datasets) {
            this.chart.data.datasets = data.datasets;
        }

        this.chart.update('none'); // No animation for real-time updates
    }

    // Add data point
    addDataPoint(label, value, datasetIndex = 0) {
        if (!this.chart) return;

        // Add new label
        this.chart.data.labels.push(label);
        
        // Add data point to dataset
        if (this.chart.data.datasets[datasetIndex]) {
            this.chart.data.datasets[datasetIndex].data.push(value);
        }

        // Keep only recent data points (e.g., last 50)
        const maxDataPoints = this.config.maxDataPoints || 50;
        if (this.chart.data.labels.length > maxDataPoints) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        this.chart.update('none');
    }

    // Update multiple datasets
    updateDatasets(datasets) {
        if (!this.chart) return;

        this.chart.data.datasets = datasets.map(dataset => ({
            ...dataset,
            fill: dataset.fill || false,
            tension: dataset.tension || 0.1
        }));

        this.chart.update('none');
    }

    // Clear chart
    clear() {
        if (!this.chart) return;

        this.chart.data.labels = [];
        this.chart.data.datasets.forEach(dataset => {
            dataset.data = [];
        });

        this.chart.update('none');
    }

    // Destroy chart
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    // Get chart data
    getData() {
        return this.data;
    }

    // Export chart as image
    exportAsImage(format = 'png', quality = 0.8) {
        if (!this.chart) {
            throw new Error('Chart not initialized');
        }

        return this.chart.toBase64Image(format, quality);
    }

    // Configure time series chart
    static createTimeSeriesChart(canvasId, config = {}) {
        return new ChartComponent(canvasId, {
            type: 'line',
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'HH:mm',
                            day: 'MMM DD',
                            week: 'MMM DD',
                            month: 'MMM YYYY'
                        }
                    }
                },
                y: {
                    beginAtZero: config.beginAtZero !== false
                }
            },
            ...config
        });
    }

    // Configure real-time chart
    static createRealTimeChart(canvasId, config = {}) {
        return new ChartComponent(canvasId, {
            type: 'line',
            responsive: true,
            animation: false,
            scales: {
                x: {
                    display: false // Hide x-axis for real-time updates
                },
                y: {
                    beginAtZero: true,
                    max: config.maxY || 100
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            ...config
        });
    }

    // Configure gauge chart
    static createGaugeChart(canvasId, config = {}) {
        return new ChartComponent(canvasId, {
            type: 'doughnut',
            cutout: '70%',
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            ...config
        });
    }

    // Configure bar chart
    static createBarChart(canvasId, config = {}) {
        return new ChartComponent(canvasId, {
            type: 'bar',
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            ...config
        });
    }

    // Configure pie chart
    static createPieChart(canvasId, config = {}) {
        return new ChartComponent(canvasId, {
            type: 'pie',
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            },
            ...config
        });
    }
}

// Specialized chart components
class PerformanceChart extends ChartComponent {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'line',
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            ...config
        });
    }

    // Add response time data
    addResponseTime(timestamp, responseTime, endpoint) {
        const label = new Date(timestamp).toLocaleTimeString();
        const value = responseTime;

        // Find or create dataset for this endpoint
        let dataset = this.chart.data.datasets.find(d => d.label === endpoint);
        if (!dataset) {
            dataset = {
                label: endpoint,
                data: [],
                borderColor: this.getRandomColor(),
                backgroundColor: this.getRandomColor(0.1),
                tension: 0.1
            };
            this.chart.data.datasets.push(dataset);
        }

        this.addDataPoint(label, value, this.chart.data.datasets.indexOf(dataset));
    }

    getRandomColor(alpha = 0.2) {
        const colors = [
            `rgba(255, 99, 132, ${alpha})`,
            `rgba(54, 162, 235, ${alpha})`,
            `rgba(255, 205, 86, ${alpha})`,
            `rgba(75, 192, 192, ${alpha})`,
            `rgba(153, 102, 255, ${alpha})`,
            `rgba(255, 159, 64, ${alpha})`
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

class ErrorChart extends ChartComponent {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'bar',
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Error Count'
                    }
                }
            },
            ...config
        });
    }

    // Update error data
    updateErrorData(errorData) {
        const labels = Object.keys(errorData);
        const values = Object.values(errorData);
        const colors = values.map(count => 
            count > 50 ? 'rgba(255, 99, 132, 0.8)' : 
            count > 20 ? 'rgba(255, 205, 86, 0.8)' : 
            'rgba(75, 192, 192, 0.8)'
        );

        this.update({
            labels,
            datasets: [{
                label: 'Errors by Service',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 1
            }]
        });
    }
}

class SystemMetricsChart extends ChartComponent {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'line',
            responsive: true,
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Usage (%)'
                    }
                }
            },
            ...config
        });
    }

    // Update system metrics
    updateSystemMetrics(metrics) {
        const timestamp = new Date().toLocaleTimeString();
        
        // CPU Dataset
        let cpuDataset = this.chart.data.datasets.find(d => d.label === 'CPU');
        if (!cpuDataset) {
            cpuDataset = {
                label: 'CPU',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1
            };
            this.chart.data.datasets.push(cpuDataset);
        }
        cpuDataset.data.push(metrics.cpu);

        // Memory Dataset
        let memoryDataset = this.chart.data.datasets.find(d => d.label === 'Memory');
        if (!memoryDataset) {
            memoryDataset = {
                label: 'Memory',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.1
            };
            this.chart.data.datasets.push(memoryDataset);
        }
        memoryDataset.data.push(metrics.memory);

        // Update labels
        this.chart.data.labels.push(timestamp);

        // Keep only recent data
        const maxPoints = 30;
        if (this.chart.data.labels.length > maxPoints) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        this.chart.update('none');
    }
}

class DatabaseChart extends ChartComponent {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'line',
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Query Time (ms)'
                    }
                }
            },
            ...config
        });
    }

    // Update database metrics
    updateDatabaseMetrics(metrics) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Average query time
        this.addDataPoint(timestamp, metrics.averageQueryTime);

        // Slow queries
        const slowQueriesDataset = this.chart.data.datasets[1] || {
            label: 'Slow Queries',
            data: [],
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.1)',
            tension: 0.1
        };
        
        if (this.chart.data.datasets.length < 2) {
            this.chart.data.datasets.push(slowQueriesDataset);
        }
        
        slowQueriesDataset.data.push(metrics.slowQueries);

        this.chart.update('none');
    }
}

module.exports = {
    ChartComponent,
    PerformanceChart,
    ErrorChart,
    SystemMetricsChart,
    DatabaseChart
};