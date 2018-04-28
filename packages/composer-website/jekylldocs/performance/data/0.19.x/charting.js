/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Pull out information
var marbles_tps = [31.34];
var marbles_cc = [113, 29.2, 84.4, 72.3, 0];
var marbles_peer = [339, 41, 278.8, 440.9, 75.2];
var marbles_cdb = [173.7, 218.18, 84.0, 147.2, 103.1];
var marbles = [marbles_cc, marbles_peer, marbles_cdb];

var basic_tps = [33.5];
var basic_cc = [113, 32.47, 75.0, 65.7, 1.2];
var basic_peer = [416.6, 48.73, 261.3, 484.6, 71];
var basic_cdb = [166.9, 204.38, 86.7, 135.5, 85.2];
var basic = [basic_cc, basic_peer, basic_cdb];

var digital_property_tps = [31.31];
var digital_property_cc = [120.5, 32.14, 81.1, 70.3, 1.2];
var digital_property_peer = [341.2, 49.12, 279.1, 450.1, 72.82];
var digital_property_cdb = [171.1, 211.86, 96.2, 149.5, 88.7];
var digital_property = [digital_property_cc, digital_property_peer, digital_property_cdb];

var bond_tps = [37.78];
var bond_cc = [109.7, 32.33, 61.4, 51.7, 1.2];
var bond_peer = [357.8, 50.1, 216.1, 380.6, 60.5];
var bond_cdb = [161.0, 205, 70.5, 108.4, 72.9];
var bond = [bond_cc, bond_peer, bond_cdb];

var vlc_create_tps = [32.22];
var vlc_create_cc = [114.4, 32.09, 74.4, 69.1, 0];
var vlc_create_peer = [303.9, 46.43, 275.5, 483.2, 78.3];
var vlc_create_cdb = [187.2, 213.85, 91.3, 134.9, 85.7];
var vlc_create = [vlc_create_cc, vlc_create_peer, vlc_create_cdb];

var vlc_update_tps = [27.53];
var vlc_update_cc = [114.5, 33.78, 104.5, 101.7, 0];
var vlc_update_peer = [395.391, 44.62, 377.8, 642.1, 110.7];
var vlc_update_cdb = [190.4, 237.69, 126.6, 190.9, 105.2];
var vlc_update = [vlc_update_cc, vlc_update_peer, vlc_update_cdb];

var vlc_scrap_tps = [34.69];
var vlc_scrap_cc = [110.8, 32.13, 71.4, 58.3, 0];
var vlc_scrap_peer = [382.8, 47.2, 239.9, 396.9, 66.1];
var vlc_scrap_cdb = [185.7, 207.38, 80.1, 126.4, 81.3];
var vlc_scrap = [vlc_scrap_cc, vlc_scrap_peer, vlc_scrap_cdb];

var query_vlc_tps = [146.7];
var query_vlc_cc = [111.3, 60.2, 84.4, 49.4, 0];
var query_vlc_peer = [292.8, 88.3, 182.4, 192.7, 1.3];
var query_vlc_cdb = [168.9, 375.7, 46.1, 118.8, 0.516];
var query_vlc = [query_vlc_cc, query_vlc_peer, query_vlc_cdb];

var radarlabels = ["Memory (MB)",
                "CPU (%)",
                "Network In (MB)",
                "Network Out (MB)",
                "Disc Write (MB)"
                ];

// starting data and values for radar chart
var radarData = {
    labels: radarlabels,
    datasets: [
        {
            label: "chaincode",
            backgroundColor: "rgba(149, 209, 60, 0.6)",
        },
        {
            label: "peer",
            backgroundColor: "rgba(83, 146, 255, 0.6)",
        },
        {
            label: "couchDB",
            backgroundColor: "rgba(113, 205, 221, 0.6)",
        }
    ]
};

// chart styling options
var radarOptions = {
    legend: {
        display: true,
        position: 'top',
        labels: {
            borderWidth: 20,
        }
    },

    title: {
        display: true,
        text: 'Marbles Network',
        fontSize: 24,
        fontStyle: '400',
        fontColor: 'black'
    }
};

// Samples Radar Chart
var sampleRadarCtx;
var sampleRadarChart;

// Micro Radar Chart
var microRadarCtx;
var microRadarChart;

// Convert to a table consumable form, each row becomes:
// [{"Container": , "Memory (MB)": , "CPU (%)": , "Network In (MB)": , "Network Out (MB)": , "Disc Write (MB)": }]
function convertToTableForm(data){
    return [
        {"Container": "chaincode", "Memory (MB)": data[0][0], "CPU (%)": data[0][1], "Network In (MB)": data[0][2], "Network Out (MB)": data[0][3], "Disc Write (MB)": data[0][4]},
        {"Container": "peer", "Memory (MB)": data[1][0], "CPU (%)": data[1][1], "Network In (MB)": data[1][2], "Network Out (MB)": data[1][3], "Disc Write (MB)": data[1][4]},
        {"Container": "couchDB", "Memory (MB)": data[2][0], "CPU (%)": data[2][1], "Network In (MB)": data[2][2], "Network Out (MB)": data[2][3], "Disc Write (MB)": data[2][4]}
    ];
}

// Update chart data
function addData(chart, data, title) {
    chart.config.data.datasets[0].data = data[0];
    chart.config.data.datasets[1].data = data[1];
    chart.config.data.datasets[2].data = data[2];
    chart.options.title.text = title;
    chart.update();
}

// Update table data
// Type == 0 => samples
// Type == 1 => micro
function updateTable(type, data){

    if (type == 0){
        $("#samplesTable").jsGrid({
            width: "100%",
            height: 300,

            autoload: true,

            controller: {
                loadData: function() {
                  return data;
              }
            },

            fields: [
                { name: "Container", type: "text", width: 150},
                { name: "Memory (MB)", type: "number", width: 150},
                { name: "CPU (%)", type: "number", width: 100 },
                { name: "Network In (MB)", type: "number", width: 100 },
                { name: "Network Out (MB)", type: "number", width: 100 },
                { name: "Disc Write (MB)", type: "number", width: 100 }
            ]
        });
    } else {
        $("#microTable").jsGrid({
            width: "100%",
            height: 300,

            autoload: true,

            controller: {
                loadData: function() {
                  return data;
              }
            },

            fields: [
                { name: "Container", type: "text", width: 150},
                { name: "Memory (MB)", type: "number", width: 150},
                { name: "CPU (%)", type: "number", width: 100 },
                { name: "Network In (MB)", type: "number", width: 100 },
                { name: "Network Out (MB)", type: "number", width: 100 },
                { name: "Disc Write (MB)", type: "number", width: 100 }
            ]
        });
    }
}


$(document).ready(function () {

    sampleRadarCtx = document.getElementById("sampleRadarChart").getContext('2d');
    sampleRadarChart = new Chart(sampleRadarCtx, {
        type: 'radar',
        data: radarData,
              pointColor: "rgba(220,220,220,1)",
              pointStrokeColor: "#fff", // starting data
        options: radarOptions,
    });

    microRadarCtx = document.getElementById("microRadarChart").getContext('2d');
    microRadarChart = new Chart(microRadarCtx, {
        type: 'radar',
        data: radarData,
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff", // starting data
        options: radarOptions,
    });

    addData(sampleRadarChart, marbles, "Marbles Sample Network");
    addData(microRadarChart, query_vlc, "Query (Vehicle Lifecycle)");
    updateTable(0, convertToTableForm(marbles));
    updateTable(1, convertToTableForm(query_vlc));
});

// Select listener
$("select").on(
    "change", function() {
        var choice = $(this).val();
        if (choice == "marbles"){
            addData(sampleRadarChart, marbles, "Marbles Sample Network");
            updateTable(0, convertToTableForm(marbles));
        } else if (choice == "basic") {
            addData(sampleRadarChart, basic, "Basic Sample Network");
            updateTable(0, convertToTableForm(basic));
        } else if (choice == "digital") {
            addData(sampleRadarChart, digital_property, "Digital Property Network");
            updateTable(0, convertToTableForm(digital_property));
        } else if (choice == "bond") {
            addData(sampleRadarChart, bond, "Bond Network");
            updateTable(0, convertToTableForm(bond));
        } else if (choice == "vln_create") {
            addData(sampleRadarChart, vlc_create, "VLC - Create Order");
            updateTable(0, convertToTableForm(vlc_create));
        } else if (choice == "vln_update") {
            addData(sampleRadarChart, vlc_update, "VLC - Update Order");
            updateTable(0, convertToTableForm(vlc_update));
        } else if (choice == "vln_scrap") {
            addData(sampleRadarChart, vlc_scrap, "VLC - Scrap Vehicle;");
            updateTable(0, convertToTableForm(vlc_scrap));
        } else {
            addData(sampleRadarChart, marbles, "Marbles Sample Network");
            updateTable(0, convertToTableForm(marbles));
        }
    }
);
