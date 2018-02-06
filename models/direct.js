const request = require('request');
const config = require('../config/config');

const baseUrl = 'https://api-sandbox.direct.yandex.com/json/v5';
const direct = {
    tsvJSON: function (tsv) {
        const lines = tsv.split("\n").filter(function (item) {
            return item.length > 0;
        });
        const result = [];
        for (let i = 0; i < lines.length; i++) {
            const obj = [];
            const currentline = lines[i].split("\t");
            for (let j = 0; j < currentline.length; j++) {
                obj.push(currentline[j]);
            }
            result.push(obj);
        }
        return result;
    },
    campaignsUrl: `${baseUrl}/campaigns/`,
    clientsUrl: `${baseUrl}/agencyclients/`,
    adsUrl: `${baseUrl}/ads/`,
    reportUrl: `${baseUrl}/reports`,
    apiRequest: function (url, method, params, client) {
        const headers = {
            'Authorization': `Bearer ${config.token}`,
            'Accept-Language': 'ru',
            'Content-Type': 'application/json; charset=utf-8'
        };
        if (client) {
            headers['Client-Login'] = client;
        }
        return new Promise(function (success, fail) {
            request.post({
                url: url,
                headers: headers,
                json: {
                    "method": method,
                    "params": params
                }
            }, function (err, res) {
                if (err) {
                    return fail(err);
                }
                return success(res.body);
            });
        });
    },

    getStat: function (client, campaings) {
        const _that = this;
        const filter = [];
        if(campaings && campaings.length) {
            filter.push({
                "Field": "CampaignId",
                "Operator": "IN",
                "Values": campaings
            });
        }
        const params = {
            "DateRangeType": "YESTERDAY",
            "Format": "TSV",
            "ReportName": "Raf",
            "IncludeVAT": false,
            "IncludeDiscount": false,
            "SelectionCriteria": {
                "Filter": filter
            },
            "ReportType": "AD_PERFORMANCE_REPORT",
            "FieldNames": ["AdId", "AdGroupId", "CampaignId", "Placement", "AdNetworkType", "Clicks", "AvgPageviews"],
        };
        return new Promise(function (success, fail) {
            _that.apiRequest(direct.reportUrl, "get", params, client).then(function (res) {
                success(direct.tsvJSON(res));
            }).catch(function (err) {
                fail(err);
            })
        });

    },

    updateClientCompaing: function (client, campaigns) {
        const _that = this;
        params = {
            "Campaigns": campaigns,
        };
        return new Promise(function (success, fail) {
            _that.apiRequest(direct.campaignsUrl, "update", params, client).then(function (res) {
                return success(res.body);
            }).catch(function (err) {
                fail(err);
            });
        });
    },

    getClients: function () {
        const _that = this;
        return new Promise(function (success, fail) {
            _that.apiRequest(direct.clientsUrl, "get", {
                "SelectionCriteria": {},
                "FieldNames": ["Login"]
            }).then(function (res) {
                return success(res.result);
            }).catch(function (err) {
                fail(err);
            });
        });
    },
    addSitesToExclude: function (data) {
        /*
        * data : {
        *   default: {wrongSites: Array},
        *   Individual: {Login:String, Ids: Array, wrongSites:Array}
        * }
        *
        **/
        const _that = this;
        data.Individual.forEach(function (client) {
            _that.getClientCompaings(client.Login, client.Ids).then(function (res) {
                const newComps = res.result.Campaigns.map(function (item) {
                    item.ExcludedSites = typeof item.ExcludedSites === 'object' ? item.ExcludedSites : {"Items": []};
                    let wrongSites = data['default'].wrongSites.concat(client.wrongSites);
                    wrongSites = wrongSites.filter(function (elem) {
                        return wrongSites.indexOf(elem) === -1;
                    });
                    compWrongSites = wrongSites.filter(function (elem) {
                        return item.ExcludedSites.Items.indexOf(elem) === -1;
                    });
                    if (compWrongSites.length) {
                        item.ExcludedSites.Items = item.ExcludedSites.Items.concat(compWrongSites);
                        return {Id: "" + item.Id, "ExcludedSites": item.ExcludedSites}
                    } else {
                        return null;
                    }
                }).filter(function (item) {
                    return item !== null;
                });
                if (newComps.length) {
                    _that.updateClientCompaing(client.Login, newComps).then(function (res) {
                        console.log(res);
                    });
                }
            });
        });
    },

    getClientCompaings: function (client, Ids) {
        const _that = this;

        params = params ? params : {
            "SelectionCriteria": {
                Ids: Ids
            },
            "FieldNames": [
                "ExcludedSites", "Id"
            ],
        };
        return new Promise(function (success, fail) {
            _that.apiRequest(direct.campaignsUrl, "get", params, client).then(function (res) {
                return success(res.body);
            }).catch(function (err) {
                fail(err);
            });
        });
    }
};

module.exports = direct;