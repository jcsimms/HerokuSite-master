// Initial calculator state model.
// This file is intentionally standalone and does not yet drive UI behavior.
(function () {
  function toNumber(value) {
    var n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  function createCapability(capabilityKey, capabilityLabel) {
    return {
      capabilityKey: capabilityKey,
      capabilityLabel: capabilityLabel,
      totalRows: 0,
      totalCredits: 0,
      totalJobsPerYear: 0,
      enabled: false,
      instances: [
        {
          id: capabilityKey + "-instance-1",
          name: capabilityLabel + " 1",
          solutionId: "",
          solutionName: "",
          rowsProcessed: 0,
          jobsPerYear: 0,
          estimatedCredits: 0,
          includeLookupData: false,
          frequency: "",
          notes: "",
          sizingMode: "",
          lookupMode: "",
          sourceSelection: {
            dataSourceIds: [],
            dataObjectIds: [],
          },
        },
      ],
    };
  }

  var calculatorState = {
    version: 1,
    generatedAtIso: new Date().toISOString(),

    // Parent object 1: Data Sources (array)
    dataSources: [
      {
        sourceId: "source-1",
        sourceName: "Source 1",
        dataType: "Customer Records",
        isUnstructured: false,
        isZeroCopy: false,
        totalRows: 0,
        totalVolumeMb: 0,
        estimatedCredits: 0,
        dataObjects: [
          {
            objectId: "source-1-object-1",
            objectName: "Customer Profile",
            category: "Profile",
            rows: 0,
            averageRowSizeKb: 0,
            includeInLandscape: true,
            estimatedCredits: 0,
          },
        ],
      },
      {
        sourceId: "source-2",
        sourceName: "Source 2",
        dataType: "Streaming Events",
        isUnstructured: false,
        isZeroCopy: false,
        totalRows: 0,
        totalVolumeMb: 0,
        estimatedCredits: 0,
        dataObjects: [
          {
            objectId: "source-2-object-1",
            objectName: "Web Event",
            category: "Engagement",
            rows: 0,
            averageRowSizeKb: 0,
            includeInLandscape: true,
            estimatedCredits: 0,
          },
        ],
      },
    ],

    // Parent object 2: System Generated Data (array)
    systemGeneratedData: [
      {
        systemDataId: "sys-unified-profiles",
        systemDataName: "Unified Profiles",
        sourceCapability: "Identity Resolution",
        totalRows: 0,
        totalCredits: 0,
        objects: [
          {
            objectId: "sys-unified-profiles-object-1",
            objectName: "Unified Profile Record",
            rows: 0,
            estimatedCredits: 0,
          },
        ],
      },
      {
        systemDataId: "sys-calculated-insights",
        systemDataName: "Calculated Insights",
        sourceCapability: "Batch Calculated Insights",
        totalRows: 0,
        totalCredits: 0,
        objects: [
          {
            objectId: "sys-calculated-insights-object-1",
            objectName: "Insight Result",
            rows: 0,
            estimatedCredits: 0,
          },
        ],
      },
    ],

    // Parent object 3: Capabilities (object with capability children)
    capabilities: {
      identityResolution: createCapability("identity-resolution", "Identity Resolution"),
      batchDataTransform: createCapability("batch-data-transform", "Batch Data Transform"),
      batchDataGraphs: createCapability("batch-data-graphs", "Batch Data Graphs"),
      batchCalculatedInsights: createCapability("batch-calculated-insights", "Batch Calculated Insights"),
      dataQueries: createCapability("data-queries", "Data Queries"),
      segmentation: createCapability("segmentation", "Segmentation"),
      activation: createCapability("activation", "Activation"),
      streamingActions: createCapability("streaming-actions", "Streaming Actions"),
      streamingCalculatedInsights: createCapability("streaming-calculated-insights", "Streaming Calculated Insights"),
      streamingDataTransforms: createCapability("streaming-data-transforms", "Streaming Data Transforms"),
      subSecondRealTimeEventsAndEntities: createCapability(
        "sub-second-real-time-events-and-entities",
        "Sub-second Real-Time Events and Entities"
      ),
      zeroCopySharingRowsAccessed: createCapability(
        "zero-copy-sharing-rows-accessed",
        "Zero Copy Sharing Rows Accessed"
      ),
    },

    totals: {
      totalRows: 0,
      totalCredits: 0,
      totalCapabilities: 12,
      totalDataSources: 2,
    },
  };

  function recomputeStateTotals(state) {
    var next = state || calculatorState;

    var sources = Array.isArray(next.dataSources) ? next.dataSources : [];
    var sourceRows = 0;
    var sourceCredits = 0;
    sources.forEach(function (src) {
      var objects = Array.isArray(src.dataObjects) ? src.dataObjects : [];
      var objectRows = 0;
      var objectCredits = 0;
      objects.forEach(function (obj) {
        objectRows += toNumber(obj.rows);
        objectCredits += toNumber(obj.estimatedCredits);
      });
      src.totalRows = objectRows;
      src.estimatedCredits = objectCredits;
      sourceRows += objectRows;
      sourceCredits += objectCredits;
    });

    var generated = Array.isArray(next.systemGeneratedData) ? next.systemGeneratedData : [];
    var generatedRows = 0;
    var generatedCredits = 0;
    generated.forEach(function (sys) {
      var objects = Array.isArray(sys.objects) ? sys.objects : [];
      var objectRows = 0;
      var objectCredits = 0;
      objects.forEach(function (obj) {
        objectRows += toNumber(obj.rows);
        objectCredits += toNumber(obj.estimatedCredits);
      });
      sys.totalRows = objectRows;
      sys.totalCredits = objectCredits;
      generatedRows += objectRows;
      generatedCredits += objectCredits;
    });

    var capabilitiesObj = next.capabilities && typeof next.capabilities === "object" ? next.capabilities : {};
    var capabilityKeys = Object.keys(capabilitiesObj);
    var capabilityRows = 0;
    var capabilityCredits = 0;
    capabilityKeys.forEach(function (key) {
      var cap = capabilitiesObj[key] || {};
      var instances = Array.isArray(cap.instances) ? cap.instances : [];
      var rows = 0;
      var credits = 0;
      var jobs = 0;
      cap.enabled = instances.length > 0;
      instances.forEach(function (instance) {
        rows += toNumber(instance.rowsProcessed);
        credits += toNumber(instance.estimatedCredits);
        jobs += toNumber(instance.jobsPerYear);
      });
      cap.totalRows = rows;
      cap.totalCredits = credits;
      cap.totalJobsPerYear = jobs;
      capabilityRows += rows;
      capabilityCredits += credits;
    });

    next.totals = next.totals || {};
    next.totals.totalRows = sourceRows + generatedRows + capabilityRows;
    next.totals.totalCredits = sourceCredits + generatedCredits + capabilityCredits;
    next.totals.totalCapabilities = capabilityKeys.length;
    next.totals.totalDataSources = sources.length;
    next.totals.sourceRows = sourceRows;
    next.totals.systemGeneratedRows = generatedRows;
    next.totals.capabilityRows = capabilityRows;

    return next;
  }

  // Expose globally for future integration work.
  window.CALCULATOR_STATE = calculatorState;
  window.recomputeStateTotals = recomputeStateTotals;
})();
