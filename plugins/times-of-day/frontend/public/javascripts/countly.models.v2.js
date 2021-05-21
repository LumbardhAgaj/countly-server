/*global countlyCommon,countlyVue,CV*/
(function(countlyTimesOfDay) {

    countlyTimesOfDay.service = {
        // eslint-disable-next-line no-unused-vars
        fetchTimesOfDay: function(filters) {
            return CV.$.ajax({
                type: "GET",
                url: countlyCommon.API_URL + "/o",
                data: {
                    app_id: countlyCommon.ACTIVE_APP_ID,
                    method: 'times-of-day',
                    date_range: filters.dateRange,
                    todType: filters.dataType,
                }
            }, {disabledAutoCatch: true});
        }
    };

    countlyTimesOfDay.getVuexModule = function() {

        var getInitialState = function() {
            return {
                timesOfDay: [],
                timesOfDayFilters: {
                    dateRange: null,
                    dataType: 'sessions'
                },
                isLoading: false,
                hasError: false,
                error: null,
            };
        };

        var countlyTimesOfDayActions = {
            fetchAll: function(context) {
                context.dispatch('onFetchInit');
                countlyTimesOfDay.service.fetchTimesOfDay(context.state.filters)
                    .then(function(response) {
                        context.commit('setTimesOfDay', response);
                        context.dispatch('onFetchSuccess');
                    }).catch(function(error) {
                        context.dispatch('onFetchError', error);
                    });
            },
            onFetchInit: function(context) {
                context.commit('setFetchInit');
            },
            onFetchError: function(context, error) {
                context.commit('setFetchError', error);
            },
            onFetchSuccess: function(context) {
                context.commit('setFetchSuccess');
            },
            onSetTimesOfDayFilters: function(context, filters) {
                context.commit('setTimesOfDayFilters', filters);
            }
        };

        var countlyTimesOfDayMutations = {
            setTimesOfDay: function(state, value) {
                state.timesOfDay = value;
            },
            setTimesOfDayFilters: function(state, value) {
                state.timesOfDayFilters = value;
            },
            setFetchInit: function(state) {
                state.isLoading = true;
                state.hasError = false;
                state.error = null;
            },
            setFetchError: function(state, error) {
                state.isLoading = false;
                state.hasError = true;
                state.error = error;
            },
            setFetchSuccess: function(state) {
                state.isLoading = false;
                state.hasError = false;
                state.error = null;
            }
        };

        return countlyVue.vuex.Module("countlyTimesOfDay", {
            state: getInitialState,
            actions: countlyTimesOfDayActions,
            mutations: countlyTimesOfDayMutations,
        });
    };

}(window.countlyTimesOfDay = window.countlyTimesOfDay || {}));