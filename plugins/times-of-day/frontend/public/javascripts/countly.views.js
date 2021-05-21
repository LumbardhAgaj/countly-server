/*global app, countlyTimesOfDay, countlyVue, $, CV */

var TimesOfDayMapChart = countlyVue.views.BaseView.extend({
    template: "#times-of-day-map-chart",
    data: function() {
        return {
            buckets: "hourly",
            period: []
        };
    },
    computed: {
        timesOfDay: function() {
            return this.$store.state.countlyTimesOfDay.timesOfDay;
        },
        xAxisTimesOfDayHours: function() {
            return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
        },
        yAxisWeekDays: function() {
            return [];
        },
        isLoading: function() {
            return this.$store.state.countlyTimesOfDay.isLoading;
        },
    }
});

var TimesOfDayTable = countlyVue.views.BaseView.extend({
    template: "#times-of-day-table",
    data: function() {
        return {};
    },
    computed: {
        timesOfDay: function() {
            return this.$store.state.countlyTimesOfDay.timesOfDay;
        },
        isLoading: function() {
            return this.$store.state.countlyTimesOfDay.isLoading;
        }
    }
});


var TimesOfDayView = countlyVue.views.BaseView.extend({
    template: "#times-of-day",
    components: {
        "countly-times-of-day-map-chart": TimesOfDayMapChart,
        "countly-times-of-day-table": TimesOfDayTable
    },
    data: function() {
        return {
            description: CV.i18n("times-of-day.description")
        };
    },
    mounted: function() {
        this.$store.dispatch('countlyTimesOfDay/fetchAll');
    }
});


var vuex = [{
    clyModel: countlyTimesOfDay
}];

app.route('/analytics/times-of-day', 'times-of-day', function() {
    var timesOfDayViewWrapper = new countlyVue.views.BackboneWrapper({
        component: TimesOfDayView,
        vuex: vuex,
        templates: [
            "/times-of-day/templates/TimesOfDay.html",
        ]
    });
    this.renderWhenReady(timesOfDayViewWrapper);
});

$(document).ready(function() {
    app.addSubMenu("behavior", {code: "times-of-day", url: "#/analytics/times-of-day", text: "times-of-day.plugin-title", priority: 30});
});