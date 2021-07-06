/* global countlyVue,CV,countlyCommon,countlyAppCarrier,*/
var AppCarrierView = countlyVue.views.create({
    template: CV.T("/core/carrier/templates/carrier.html"),
    data: function() {
        return {
            description: CV.i18n('carriers.description')
        };
    },
    mounted: function() {
        this.$store.dispatch('countlyAppCarrier/fetchAll');
    },
    methods: {
        refresh: function() {
            this.$store.dispatch('countlyAppCarrier/fetchAll');
        }
    },
    computed: {
        selectedDatePeriod: {
            get: function() {
                return this.$store.state.countlyAppCarrier.selectedDatePeriod;
            },
            set: function(value) {
                this.$store.dispatch('countlyAppCarrier/onSetSelectedDatePeriod', value);
                this.$store.dispatch('countlyAppCarrier/fetchAll');
            }
        },
        appCarrier: function() {
            return this.$store.state.countlyAppCarrier.appCarrier;
        },
        pieOptionsNew: function() {
            var self = this;
            return {
                series: [
                    {
                        name: CV.i18n('common.table.new-users'),
                        data: self.appCarrier.pie["newUsers"],
                        label: {
                            formatter: function() {
                                return CV.i18n('common.table.new-users') + " " + countlyCommon.getShortNumber(self.appCarrier.totals["newUsers"] || 0);
                            }
                        },
                        center: ["25%", "50%"] //Center should be passed as option
                    }
                ]
            };
        },
        pieOptionsTotal: function() {
            var self = this;
            return {
                series: [
                    {
                        name: CV.i18n('common.table.total-sessions'),
                        data: self.appCarrier.pie["totalSessions"],
                        label: {
                            formatter: function() {
                                return CV.i18n('common.table.total-sessions') + " " + countlyCommon.getShortNumber(self.appCarrier.totals["totalSessions"]);
                            }
                        },
                        center: ["25%", "50%"] //Center should be passed as option
                    }
                ]
            };
        },
        appCarrierRows: function() {
            return this.appCarrier.table || [];
        },
        isLoading: function() {
            return this.$store.state.countlyAppCarrier.isLoading;
        }
    }
});



countlyVue.container.registerTab("/analytics/technology", {
    priority: 5,
    name: "carrier",
    title: CV.i18n('carriers.title'),
    component: AppCarrierView,
    vuex: [{
        clyModel: countlyAppCarrier
    }]
});

