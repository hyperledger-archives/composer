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
var bond_network = [18, 14, 10, 11, 8, 4];
var bond_network_CC_2_1 = [91, 16.2, 0.766, 0.885, 0, 1.2];
var bond_network_peer_2_1 = [25, 22.1, 0.955, 1.250, 0, 3.1];
var bond_network_DB_2_1 = [46, 12.5, 0.456, 0.688, 0, 0.8];

var digital_property = [18, 14, 10, 11, 8, 5];
var digital_property_CC = [25, 22.1, 0.955, 1.250, 0, 3.1];

var marbles_network = [5, 30, 40, 60, 12, 7];
var marbles_network_CC = [91, 16.2, 0.766, 0.885, 0, 1.2];

var vlc_place_order = [12, 5, 18, 28, 23, 2];
var vlc_place_order_CC = [91, 16.2, 0.766, 0.885, 0, 1.2];

var vlc_scrap_vehicle = [12, 5, 18, 28, 15, 20];
var vlc_scrap_vehicle_CC = [91, 16.2, 0.766, 0.885, 0, 1.2];

var vlc_update_order = [12, 5, 10, 12, 46, 2];
var vlc_update_order_CC = [91, 16.2, 0.766, 0.885, 0, 1.2];


var labels1 = ["2 Orgs, 1 Peer",
               "2 Orgs, 2 Peers",
               "2 Orgs, 3 Peers",
               "3 Orgs, 1 Peer",
               "3 Orgs, 2 Peers",
               "3 Orgs, 3 Peers"];
 var radarlabels = ["Memory (MB)",
                    "CPU (%)",
                    "Network In (MB)",
                    "Network Out (MB)",
                    "Disc Read (MB)",
                    "Disc Write (MB)"
                   ];

// starting data and values for myChart
var data1 = {
    labels: labels1,
    datasets: [{
        data: bond_network,
        backgroundColor: "rgb(83, 146, 255)",
    }]
};

 var data2 = {
    labels: radarlabels,
    datasets: [{
        data: bond_network_CC_2_1,
        backgroundColor: "rgba(83, 146, 255, 0.6)",
    }]
};


// chart styling options
var options = {
    scales: {
        gridLines: {
          display: true,
          color: 'rgb(60, 109, 240)',
        },
        yAxes: [{
            ticks: {
                beginAtZero: true,
                stepSize: 5,
            },
            scaleLabel: {
                display: true,
                labelString: 'Transactions Per Second (TPS)'
            }
        }],
        xAxes: [{
            barPercentage: 0.7,
            scaleLabel: {
                display: false,
                labelString: 'Business Networks'
            }
        }]
    },
    legend: {
        display: false,
        position: 'top',
        labels: {
            borderWidth: 0,
        }
    },

    title: {
        display: true,
        text: 'Bond Network',
        fontSize: 18,
        fontStyle: '600',
        fontColor: 'black',
        align: 'start',
    }
};

var Radaroptions = {
    legend: {
        display: false,
        position: 'top',
        labels: {
            borderWidth: 0,
        }
    },

    title: {
        display: true,
        text: 'Bond Network',
        fontSize: 14,
        fontStyle: '400',
        fontColor: 'black'
    }
};

// chart code and intial data for Bar chart
var ctx = document.getElementById("myChart").getContext('2d');
var myChart = new Chart(ctx, {
    type: 'bar',
    data: data1, // starting data
    options: options,
});

var ctx = document.getElementById("radarChart").getContext('2d');
var myChart2 = new Chart(ctx, {
    type: 'radar',
    data: data2,
          pointColor: "rgba(220,220,220,1)",
          pointStrokeColor: "#fff", // starting data
    options: Radaroptions,
});


// example from chart.js website - modified by Ellie
// the function doesn't update labels so removed that
// modified the data array path and added colour update
function addData(chart, data, colour, title) {
    chart.config.data.datasets[0].data = data;
    chart.config.data.datasets[0].backgroundColor = colour;
    chart.options.title.text = title;
    chart.update();
}

// Button listener
$(document).ready(function () {
    $("#data1").click(function () { addData(myChart, bond_network, "rgb(83, 146, 255)", "Bond Network") });
    $("#data2").click(function () { addData(myChart, digital_property, "rgb(155, 130, 243)", "Digital Property Network") });
    $("#data3").click(function () { addData(myChart, marbles_network, "rgb(52, 188, 110)", "Marbles Network") });
    $("#data4").click(function () { addData(myChart, vlc_place_order, "rgb(113, 205, 221)", "VLC - Place Order") });
    $("#data5").click(function () { addData(myChart, vlc_scrap_vehicle, "rgb(255, 176, 0)", "VLC - Scrap Vehicle") });
    $("#data6").click(function () { addData(myChart, vlc_update_order, "rgb(255, 80, 158)", "VLC - Update Order") });

    $("#data7").click(function () { addData(myChart2, bond_network_CC_2_1, "rgba(113, 205, 221, 0.6)", "Bond Network") });
    $("#data8").click(function () { addData(myChart2, digital_property_CC, "rgba(52, 188, 110, 0.6)", "Digital Property Network") });
    $("#data9").click(function () { addData(myChart2, marbles_network_CC, "rgba(149, 209, 60, 0.6)", "Marbles Network") });
    $("#data10").click(function () { addData(myChart2, vlc_place_order_CC, "rgba(255, 176, 0, 0.6)", "VLC - Place Order") });
    $("#data11").click(function () { addData(myChart2, vlc_scrap_vehicle_CC, "rgba(254, 133, 0, 0.6)", "VLC - Scrap Vehicle") });
    $("#data12").click(function () { addData(myChart2, vlc_update_order_CC, "rgba(255, 80, 158, 0.6)", "VLC - Update Order") });
});
