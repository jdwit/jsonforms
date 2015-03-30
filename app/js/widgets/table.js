
var app = angular.module('jsonForms.table', []);

app.run(['RenderService', 'BindingService', 'EndpointMapping', 'DataCommon', '$http', '$q', '$location', function(RenderService, BindingService, EndpointMapping, DataCommon, $http, $q, $location) {

    function createTableUIElement(element, type, instanceData, schema) {

        var paginationEnabled = false;
        var filteringEnabled  = false;

        if (DataCommon.isObjectType(element)) {
            paginationEnabled = EndpointMapping.map(type).isPaginationEnabled();
            filteringEnabled = EndpointMapping.map(type).isFilteringEnabled();
        }

        var uiElement = RenderService.createUiElement(element.displayname, element.feature.name, type, element.value);
        var tableOptions = {
            columns: element.columns,
            gridOptions: {
                enableFiltering: filteringEnabled,
                enablePaginationControls: paginationEnabled,
                enableColumnResizing: true,
                enableAutoResize: true,
                columnDefs: [{
                    field: element.idLabel.toLowerCase(),
                    cellTemplate: '<a href="#/<<TYPE>>/{{row.entity.id}}">{{row.entity[col.field]}}</a>'
                }],
                data: [],
                useExternalFiltering: true
            }
        };

        if (paginationEnabled) {
            tableOptions.gridOptions.enablePagination = paginationEnabled;
            tableOptions.gridOptions.useExternalPagination = true;
            // TODO: dummys
            tableOptions.gridOptions.paginationPageSizes = [5,10];
            tableOptions.gridOptions.paginationPageSize = 5;
            tableOptions.gridOptions.paginationPage = 1;
        }


        // push all columns defined in the view model
        for (var j = 0; j < element.columns.length; j++) {
            if (element.idLabel.toLowerCase() !== element.columns[j].feature.name){
                tableOptions.gridOptions.columnDefs.push({
                    field: element.columns[j].feature.name
                });
            }
        }

        var firstColumnDef = tableOptions.gridOptions.columnDefs[0];

        if (DataCommon.isObjectType(type)) {
            firstColumnDef.cellTemplate = firstColumnDef.cellTemplate.replace("<<TYPE>>", EndpointMapping.map(type).many);
        } else {
            console.log("INFO: data not fetched since no object type present.");
        }

        // convenience methods --
        uiElement.enablePaginationControls = function() {
            tableOptions.gridOptions.enablePaginationControls = true;
        };
        uiElement.disablePaginationControls = function() {
            tableOptions.gridOptions.enablePaginationControls = false;
        };
        uiElement.fetchPagedData = function() {
            console.log("INFO: within fetchPagedData");
            var that = this;

            var currentPage = tableOptions.gridOptions.paginationPage;
            var pageSize = tableOptions.gridOptions.paginationPageSize;


            var resolverKind = EndpointMapping.resolverKind(type.type, element.feature.name);

            // TODO
            if (resolverKind.kind === 2) {
                var attributeType  = resolverKind.type;
                if (attributeType !== undefined) {
                    if (currentPage === undefined) {
                        currentPage = EndpointMapping.map(resolverKind.type).pagination.defaultPage;
                    }
                    if (pageSize === undefined) {
                        pageSize = EndpointMapping.map(resolverKind.type).pagination.defaultPageSize;
                    }
                    var u = EndpointMapping.map(resolverKind.type).page(currentPage, pageSize);
                    var segments = $location.absUrl().split("/");
                    var hostId = segments[segments.length - 1];

                    u = u.replace("{{id}}", hostId);

                    $http.get(u).success(function (newData) {
                        console.log("INFO: fetched data from " + u + " of size " + newData.length);
                        console.log("INFO: fetch data is " + JSON.stringify(newData));
                        tableOptions.gridOptions.data = newData;
                        that.setTotalItems();
                    });
                }
            }

            if (currentPage === undefined) {
                currentPage = EndpointMapping.map(type).pagination.defaultPage;
            }
            if (pageSize === undefined) {
                pageSize = EndpointMapping.map(type).pagination.defaultPageSize;
            }
            if (DataCommon.isObjectType(type)) {
                var url = EndpointMapping.map(type).page(currentPage, pageSize);
                $http.get(url).success(function (newData) {
                    console.log("INFO: fetched data from " + url + " of size " + newData.length);
                    console.log("INFO: fetch data is " + JSON.stringify(newData));
                    tableOptions.gridOptions.data = newData;
                    that.setTotalItems();
                });
            } else {
                tableOptions.gridOptions.data = instanceData;
                console.log("INFO: data not fetched since no object type present.");
            }
        };
        uiElement.fetchFilteredData = function(searchTerms) {
            var url = EndpointMapping.map(type).filter(searchTerms);
            console.log("INFO: search terms are " + JSON.stringify(searchTerms));
            console.log("INFO: filter URL is " + url);
            $http.get(url).success(function (data) {
                tableOptions.gridOptions.data = data;
            });

        };
        uiElement.setTotalItems = function() {
            var url = EndpointMapping.map(type).count();
            $http.get(url).success(function (countObj) {
                console.log("INFO: totalItems are " + JSON.stringify(countObj.count));
                tableOptions.gridOptions.totalItems = countObj.count;
            });
        };
        uiElement.registerCallbacks = function($scope) {
            var that = this;
            tableOptions.gridOptions.onRegisterApi = function (gridApi) {
                gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    tableOptions.gridOptions.paginationPage = newPage;
                    tableOptions.gridOptions.paginationPageSize = pageSize;
                    that.fetchPagedData();
                });
                gridApi.core.on.filterChanged($scope, function () {
                    var grid = this.grid;
                    var searchTerms = findSearchTerms(grid);
                    if (searchTerms.length > 0) {
                        that.fetchFilteredData(searchTerms);
                        that.disablePaginationControls();
                    } else {
                        that.fetchPagedData();
                        that.enablePaginationControls();
                    }
                });

            }
        };

        uiElement.tableOptions = tableOptions;

        return uiElement;
    }

    // type is a domain type, not an UI type
    function createTypeTableUIElement(element, type) {

        var paginationEnabled = EndpointMapping.map(type).isPaginationEnabled();
        var filteringEnabled = EndpointMapping.map(type).isFilteringEnabled();

        var uiElement = RenderService.createUiElement(element.displayname, element.scope.type, {type: "array"}, element.value);
        var tableOptions = {
            columns: element.columns,
            gridOptions: {
                enableFiltering: filteringEnabled,
                enablePaginationControls: paginationEnabled,
                enableColumnResizing: true,
                enableAutoResize: true,
                columnDefs: [{
                    field: element.idLabel.toLowerCase(),
                    cellTemplate: '<a href="#/<<TYPE>>/{{row.entity.id}}">{{row.entity[col.field]}}</a>'
                }],
                data: [],
                useExternalFiltering: true
            }
        };

        if (paginationEnabled) {
            tableOptions.gridOptions.enablePagination = paginationEnabled;
            tableOptions.gridOptions.useExternalPagination = true;
            // TODO: dummys
            tableOptions.gridOptions.paginationPageSizes = [5,10];
            tableOptions.gridOptions.paginationPageSize = 5;
            tableOptions.gridOptions.paginationPage = 1;
        }


        // push all columns defined in the view model
        for (var j = 0; j < element.columns.length; j++) {
            if (element.idLabel.toLowerCase() !== element.columns[j].feature.name){
                tableOptions.gridOptions.columnDefs.push({
                    field: element.columns[j].feature.name
                });
            }
        }

        var firstColumnDef = tableOptions.gridOptions.columnDefs[0];
        firstColumnDef.cellTemplate = firstColumnDef.cellTemplate.replace("<<TYPE>>", EndpointMapping.map(type).many);

        // convenience methods --
        uiElement.enablePaginationControls = function() {
            tableOptions.gridOptions.enablePaginationControls = true;
        };
        uiElement.disablePaginationControls = function() {
            tableOptions.gridOptions.enablePaginationControls = false;
        };
        uiElement.fetchPagedData = function() {
            console.log("INFO: within fetchPagedData");
            var that = this;

            var currentPage = tableOptions.gridOptions.paginationPage;
            var pageSize = tableOptions.gridOptions.paginationPageSize;

            var url = EndpointMapping.map(type).page(currentPage, pageSize);
            $http.get(url).success(function (newData) {
                console.log("INFO: fetched data from " + url + " of size " + newData.length);
                console.log("INFO: fetch data is " + JSON.stringify(newData));
                tableOptions.gridOptions.data = newData;
                that.setTotalItems();
            });
        };
        uiElement.fetchFilteredData = function(searchTerms) {
            var url = EndpointMapping.map(type).filter(searchTerms);
            console.log("INFO: search terms are " + JSON.stringify(searchTerms));
            console.log("INFO: filter URL is " + url);
            $http.get(url).success(function (data) {
                tableOptions.gridOptions.data = data;
            });

        };
        uiElement.setTotalItems = function() {
            var url = EndpointMapping.map(type).count();
            $http.get(url).success(function (countObj) {
                console.log("INFO: totalItems are " + JSON.stringify(countObj.count));
                tableOptions.gridOptions.totalItems = countObj.count;
            });
        };
        uiElement.registerCallbacks = function($scope) {
            var that = this;
            tableOptions.gridOptions.onRegisterApi = function (gridApi) {
                gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                    tableOptions.gridOptions.paginationPage = newPage;
                    tableOptions.gridOptions.paginationPageSize = pageSize;
                    that.fetchPagedData();
                });
                gridApi.core.on.filterChanged($scope, function () {
                    var grid = this.grid;
                    var searchTerms = findSearchTerms(grid);
                    if (searchTerms.length > 0) {
                        that.fetchFilteredData(searchTerms);
                        that.disablePaginationControls();
                    } else {
                        that.fetchPagedData();
                        that.enablePaginationControls();
                    }
                });

            }
        };

        uiElement.tableOptions = tableOptions;

        return uiElement;
    }

    function createTableControlObject() {
        return {
            "type": "Control",
            "elements": [],
            "size": maxSize
        };
    }

    var findSearchTerms = function(grid) {
        var searchTerms = [];
        for (var i = 0; i < grid.columns.length; i++) {
            var searchTerm = grid.columns[i].filters[0].term;
            if (searchTerm !== undefined && searchTerm !== null) {
                searchTerms.push({
                    column: grid.columns[i].name,
                    term: searchTerm
                });
            }
        }

        return searchTerms;
    };

    RenderService.register({
        id: "TypeTable",
        render: function (element, schema, instance, $scope) {

            var tObject = createTableControlObject();
            var tableUiElement = createTypeTableUIElement(element, element.scope.name);

            tableUiElement.registerCallbacks($scope);
            tableUiElement.fetchPagedData();

            tObject.elements.push(tableUiElement);
            BindingService.add(tableUiElement.id, tableUiElement.value);

            return tObject;
        }
    });

    RenderService.register({
        id: "Table",
        render: function (element, schema, instanceData, $scope) {
            var tObject = createTableControlObject();
            var value = DataCommon.getValue(element.feature.name, instanceData);
            var type = DataCommon.getType(element.feature.name, schema);
            if (type.type == "array") {
                console.log(JSON.stringify(schema));
                var tableUiElement = createTableUIElement(element, type, value, schema);

                tableUiElement.registerCallbacks($scope);
                tableUiElement.fetchPagedData();

                tObject.elements.push(tableUiElement);
                BindingService.add(tableUiElement.id, tableUiElement.value);
                return tObject;
            } else {
                console.log("WARNING: " + element.feature.name + " has not expected type array.")
            }

        }
    });
}]);