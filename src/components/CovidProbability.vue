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
            <div class="col m6 s12" v-if="statistics.cases">
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
                    <li class="collection-item">
                        <div>Recovered <div class="secondary-content">{{ statistics.cases.recovered }}
                        </div></div>
                    </li>
                    <li class="collection-item">
                        <div>Total <div class="secondary-content">{{ statistics.cases.total }}</div></div>
                    </li>
                </ul>
                <p class="blue-grey-text">Last updated: {{ formatDate(statistics.time) }}</p>
            </div>
            <div class="col m6 s12" v-if="statistics.deaths">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Confirmed Deaths</h4></li>
                    <li class="collection-item">
                        <div>New <div class="secondary-content">{{ statistics.deaths.new }}</div></div>
                    </li>
                    <li class="collection-item">
                        <div>Total <div class="secondary-content">{{ statistics.deaths.total }}</div></div>
                    </li>
                </ul>
                <p class="blue-grey-text">Last updated: {{ formatDate(statistics.time) }}</p>
            </div>
        </div>
        <div class="row">
            <div id="chart"></div>
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
            renderGraph() {
                document.querySelector('#chart')!.innerHTML = "";
                let margin = {top: 10, right: 30, bottom: 30, left: 60},
                    width = 800 - margin.left - margin.right,
                    height = 400 - margin.top - margin.bottom;

                let svg = d3.select('#chart')
                    .append('svg')
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");


                const data = this.history.map((record: any) => {
                    return { date: d3.timeParse("%Y-%m-%d")(record.day), value: record.cases.active }
                });
                // Add X axis --> it is a date format
                const x = d3.scaleTime().domain(d3.extent(data,  (d: any) => {
                    return d.date;
                })).range([0, width]);
                svg.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));

                // Add Y axis
                const y = d3.scaleLinear()
                    .domain([0, d3.max(data,  (d: any) => {
                        return +d.value;
                    })]).range([height, 0]);
                svg.append("g")
                    .call(d3.axisLeft(y));

                // Add the line
                svg.append("path")
                    .datum(data)
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x((d) => {
                            return x(d.date)
                        })
                        .y((d) => {
                            return y(d.value)
                        })
                    );
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
</style>
