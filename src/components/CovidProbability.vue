<template>
    <div class="container">
        <div class="row">
                <img alt="Vue logo" src="../assets/covid-virus.png">
        </div>
        <h2>Covid-19 Contact Probability</h2>
        <div class="row">
            <div class="input-field col m6 s12 offset-m3">
                <select id="country" v-model="country" @change="getStatsForCountry">
                    <option v-for="item in countries">{{ item }}</option>
                </select>
                <label for="country">Choose your country</label>
            </div>
        </div>
        <div class="row" v-if="provinces.length > 1">
            <div class="input-field col m6 s12 offset-m3">
                <select id="state" v-model="province" @change="getProvinceStats">
                    <option v-for="item in provinces" :value="item.population">{{ item.name }}</option>
                </select>
                <label for="state">Choose your state</label>
            </div>
        </div>

        <div class="row">
            <div class="col s12" v-if="probability">
                <h4>Covid-19 probability </h4>
                <p class="blue-grey-text flow-text">{{ percentage }}%</p>
                <span class="grey-text">{{ probability }}</span>
                <p class="blue-grey-text">Your chances of coming in contact with an infected person in {{ country }}.</p>
            </div>
        </div>
        <div class="row">
            <div class="col m12 s12" v-if="statistics.cases">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Confirmed Cases</h4></li>
                    <li class="collection-item">
                        <div>New <div class="secondary-content">{{ statistics.cases.new }}</div></div>
                    </li>
                    <li class="collection-item">
                        <div>Active <div class="secondary-content">{{ statistics.cases.active }}</div></div>
                    </li>
                    <li class="collection-item">
                        <div>Critical <div class="secondary-content">{{ statistics.cases.critical }}</div></div>
                    </li>
                    <li class="collection-item alert-info">
                        <div>Recovered <div class="secondary-content">{{ statistics.cases.recovered }}</div></div>
                    </li>
                    <li class="collection-item alert-danger">
                        <div>Total <div class="secondary-content">{{ statistics.cases.total }}</div></div>
                    </li>
                    <li class="collection-item">
                        <div>New Deaths <div class="secondary-content">{{ statistics.deaths.new }}</div></div>
                    </li>
                    <li class="collection-item alert-dark">
                        <div>Total Deaths <div class="secondary-content">{{ statistics.deaths.total }}</div></div>
                    </li>
                </ul>
                <p class="blue-grey-text">Last updated: {{ formatDate(statistics.time) }}</p>
            </div>
        </div>
        <div class="row">
            <h3>Growth of active cases</h3>
            <div id="chart"></div>
            <div class="input-field col m6 s12 offset-m3" v-show="history.length > 0">
                <select id="_domain" v-model="domainAdjust" @change="adjustDomainValue">
                    <option value="200">200</option>
                    <option value="400">400</option>
                    <option value="600">600</option>
                    <option value="800">800</option>
                    <option value="1000">1000</option>
                    <option value="1200">1200</option>
                    <option value="1400">1400</option>
                    <option value="1600">1600</option>
                    <option value="1800">1800</option>
                    <option value="2000">2000</option>
                    <option value="3000">3000</option>
                    <option value="4000">4000</option>
                    <option value="5000">5000</option>
                    <option value="6000">6000</option>
                    <option value="7000">7000</option>
                    <option value="8000">8000</option>
                    <option value="9000">9000</option>
                    <option value="10000">10000</option>

                </select>
                <label for="_domain">Adjust x-axis</label>
            </div>
        </div>
        <div class="row">
            <h4>{{ country }} Timeline</h4>
            <table class="striped">
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Active</th>
                    <th>New Cases</th>
                    <th>Recovered</th>
                    <th>Deaths</th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="item in history">
                    <td>{{ formatDate(item.time) }}</td>
                    <td>{{ item.cases.active }}</td>
                    <td>{{ item.cases.new || 0 }}</td>
                    <td>{{ item.cases.recovered }}</td>
                    <td>{{ item.deaths.total }}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import {HistorySchema, StatsSchema} from '@/schema/schemas';
    import {SouthAfricanData} from '@/schema/south-african-data';
    import {AxiosResponse} from "axios";
    import * as d3 from "d3"
    export default Vue.extend({
        data () {
            return {
                probability: null,
                percentage: null,
                country: null,
                province: null,
                population: null,
                domainAdjust: 2000,
                countries: [],
                provinces: [],
                history: [],
                statistics: {},
            }
        },
        async mounted() {
            this.getCountries();
        },
        methods: {
            async getCountries () {
                try {
                    const res = await this.$http.get('/countries') as AxiosResponse;
                    if (res.data.errors.length === 0) {
                        this.countries = res.data.response;
                        setTimeout(() => {
                            (window as any).M.FormSelect.init(document.querySelectorAll("select"));
                        }, 1000)
                    }
                } catch (e) {
                    console.error(e);
                }
            },
            async getStatsForCountry() {
                try {
                    const stats = await this.$http.get(`statistics?country=${this.country}`) as AxiosResponse;
                    if (stats.data.errors.length === 0) {
                        this.statistics = stats.data.response[0] as StatsSchema;
                        await this.getProvinces();
                        (window as any).M.FormSelect.init(document.querySelectorAll("select"));
                    }
                    await this.getCountryHistory();
                } catch (e) {
                    console.error(e);
                }
            },
            async getCountryHistory () {
                try {
                    const result = await this.$http.get(`/history?country=${this.country}`) as AxiosResponse;
                    if (result.data.errors.length === 0) {
                        this.history = result.data.response as HistorySchema[];
                        this.renderGraph();
                    }
                } catch (e) {
                    console.error(e);
                }
            },
            getProvinceStats () {
                this.probability = this.calculateProbability(1170, this.province);
                this.percentage = (this.probability * 100).toFixed(6);
            },
            async getProvinces() {
                /** call for get a country states
                 * this call is however not available to me
                 * nor is the call to get world population stats
                 * */
                if (this.country.toLowerCase().includes("south-africa")) {
                    this.provinces = SouthAfricanData.provinces;
                    this.population = SouthAfricanData.population;
                    const activeCases = parseInt(this.statistics.cases.active);
                    const totalPopulation = parseInt(this.population);
                    this.probability = this.calculateProbability(activeCases, totalPopulation);
                    this.percentage = (this.probability * 100).toFixed(6);
                } else {
                    this.provinces = [];
                }
            },
            calculateProbability (interest: number, total: number) {
                return (interest/total);
            },
            formatDate (date: string) {
                let incident = new Date(date);
                return incident.toUTCString();
            },
            adjustDomainValue() {
                this.renderGraph();
            },
            renderGraph() {
                document.querySelector('#chart')!.innerHTML = "";
                let margin = {top: 10, right: 30, bottom: 30, left: 60},
                    width = 900 - margin.left - margin.right,
                    height = 600 - margin.top - margin.bottom;

                let svg = d3.select('#chart')
                    .append('svg')
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");


                let data = this.history.map((record: any) => {
                    return { date: record.day, value: record.cases.total }
                });
                // reverse the date to ascending
                data = data.reverse();
                // Add X axis --> it is a date format
                const x = d3.scaleBand()
                    .range([ 0, width ])
                    .domain(data.map(function(d) { return d.date; }))
                    .padding(0.2);
                svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");

                // Add Y axis
                const y = d3.scaleLinear()
                    .domain([0, this.domainAdjust])
                    .range([ height, 0]);
                svg.append("g")
                    .call(d3.axisLeft(y));

                // Add the line
                svg.selectAll("mybar")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return x(d.date); })
                    .attr("y", function(d) { return y(d.value); })
                    .attr("width", x.bandwidth())
                    .attr("height", function(d) { return height - y(d.value); })
                    .attr("fill", "#69b3a2");
            }
        }
    });
</script>

<style lang="scss" scoped>
    img {
        width: 60%;
    }
    .collection.with-header {
        li {
            text-align: justify;
        }
        li.collection-item {
            font-size: 20px;
        }
    }
    .alert-danger {
        color: #721c24;
        background-color: #f8d7da !important;
        border-color: #f5c6cb;
    }
    .alert-warning {
        color: #856404;
        background-color: #fff3cd !important;
        border-color: #ffeeba;
    }
    .alert-info {
        color: #0c5460;
        background-color: #d1ecf1 !important;
        border-color: #bee5eb;
    }
    .alert-dark {
        color: #1b1e21;
        background-color: #d6d8d9 !important;
        border-color: #c6c8ca;
    }
</style>
