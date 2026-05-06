(function () {
  "use strict";

  var MAX_STEP = 5;
  var currentStep = 1;
  var dataLandscapeSeeded = false;

  document.querySelectorAll(".top-tabs__tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".top-tabs__tab").forEach(function (t) {
        t.classList.remove("top-tabs__tab--active");
      });
      tab.classList.add("top-tabs__tab--active");
    });
  });

  var saveBtn = document.querySelector(".btn--gold");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      saveBtn.textContent = "Saved";
      window.setTimeout(function () {
        saveBtn.textContent = "Save Data";
      }, 1200);
    });
  }

  var stepItems = document.querySelectorAll(".steps__item");
  var panelSteps = document.querySelectorAll(".panel__step");
  var backBtn = document.querySelector(".panel__back");
  var nextBtn = document.querySelector(".panel__next");
  var sourceList = document.querySelector(".js-source-list");
  var addSourceBtn = document.querySelector(".js-add-source");
  var rowTemplate = document.getElementById("source-row-template");
  var detailSubrowTemplate = document.getElementById("detail-subrow-template");
  var sourceRowUid = 0;
  var dataPrepItemUid = 0;
  var landscapeSourceSeq = 0;
  var landscapePickMenuUid = 0;
  var UNSTRUCTURED_CATEGORY = "Unstructured Data and Documents";
  var CUSTOMER_RECORDS = "Customer Records";
  var STREAMING_EVENTS = "Streaming Events";
  var SUB_SECOND_EVENTS = "Sub-Second Events";
  var ZERO_COPY = "Zero Copy";
  var LANDSCAPE_BUCKETS = [
    { key: "bulk", category: CUSTOMER_RECORDS, segment: false },
    { key: "streaming", category: STREAMING_EVENTS, segment: false },
    { key: "subsecond", category: SUB_SECOND_EVENTS, segment: false },
    { key: "unstructured", category: UNSTRUCTURED_CATEGORY, segment: true },
    { key: "zerocopy", category: ZERO_COPY, segment: false },
  ];
  var DATA_PREP_QUESTION_DEFS = [
    { kind: "identity" },
    { kind: "transforms" },
    { kind: "data-graphs" },
    { kind: "insights" },
  ];
  var syncingDataPrepQuestionRows = false;
  var RECORD_TOTAL_READONLY_TITLE =
    "Row total (computed from object/stream volumes when Edit is used, or total volume in MB for unstructured data)";
  var RECORD_TOTAL_UNSTRUCTURED_TITLE =
    "Total volume in megabytes (enter manually for this source)";

  /** Sum of each source's Total Rows (excludes unstructured / MB-only rows and segment rows). */
  function sumRowTotalsFromDataSources() {
    if (!sourceList) {
      return 0;
    }
    var sum = 0;
    sourceList.querySelectorAll(".source-row").forEach(function (row) {
      if (row.classList.contains("source-row--segment")) {
        return;
      }
      if (getCategoryTypeLabel(row) === UNSTRUCTURED_CATEGORY) {
        return;
      }
      var rt = row.querySelector(".js-record-total");
      var v = parseLocaleNumber(rt && rt.value);
      if (!isNaN(v)) {
        sum += v;
      }
    });
    return sum;
  }

  function updateDataSourcesBarCount() {
    var el = document.querySelector(".js-data-sources-row-count");
    if (!el) {
      return;
    }
    el.textContent = formatEnUSNumber(Math.round(sumRowTotalsFromDataSources()));
  }

  function parseLocaleNumber(str) {
    if (str == null || str === "") {
      return NaN;
    }
    var cleaned = String(str).replace(/,/g, "").trim();
    if (cleaned === "") {
      return NaN;
    }
    var n = parseFloat(cleaned);
    return n;
  }

  function formatEnUSNumber(n) {
    if (n === null || n === undefined || (typeof n === "number" && isNaN(n))) {
      return "";
    }
    return Number(n).toLocaleString("en-US");
  }

  function attachCommaFormatting(el, opts) {
    opts = opts || {};
    if (!el || el.getAttribute("data-comma-format") === "1") {
      return;
    }
    el.setAttribute("data-comma-format", "1");
    if (opts.readOnly) {
      return;
    }
    el.addEventListener("focus", function () {
      el.value = String(el.value).replace(/,/g, "");
    });
    el.addEventListener("blur", function () {
      var raw = parseLocaleNumber(el.value);
      if (isNaN(raw)) {
        if (String(el.value).trim() === "") {
          el.value = "";
        }
        return;
      }
      el.value = formatEnUSNumber(raw);
    });
  }

  function formatNumericFieldsIn(root) {
    var scope = root || document;
    scope.querySelectorAll(".js-formatted-number").forEach(function (el) {
      if (!el.value || !String(el.value).trim()) {
        return;
      }
      var raw = parseLocaleNumber(el.value);
      if (!isNaN(raw)) {
        el.value = formatEnUSNumber(raw);
      }
    });
  }

  function getCustomerCount() {
    var el = document.getElementById("customer-count");
    if (!el) {
      return 0;
    }
    var v = parseLocaleNumber(el.value);
    return isNaN(v) ? 0 : v;
  }

  function countRowsForBucket(bucketKey) {
    if (!sourceList) {
      return 0;
    }
    return sourceList.querySelectorAll('.source-row[data-landscape-bucket="' + bucketKey + '"]').length;
  }

  function readBucketTargetFromInput(bucketKey) {
    var el = document.getElementById("landscape-count-" + bucketKey);
    if (!el) {
      return 0;
    }
    var raw = parseLocaleNumber(el.value);
    if (isNaN(raw)) {
      return countRowsForBucket(bucketKey);
    }
    var n = Math.floor(raw);
    if (n < 0) {
      return 0;
    }
    return Math.min(n, 100);
  }

  function updateLandscapeBucketInputsFromDom() {
    LANDSCAPE_BUCKETS.forEach(function (b) {
      var el = document.getElementById("landscape-count-" + b.key);
      if (el) {
        el.value = formatEnUSNumber(countRowsForBucket(b.key));
      }
    });
  }

  function appendRowInBucketPosition(row, bucketKey) {
    if (!sourceList) {
      return;
    }
    var bIndex = -1;
    for (var i = 0; i < LANDSCAPE_BUCKETS.length; i += 1) {
      if (LANDSCAPE_BUCKETS[i].key === bucketKey) {
        bIndex = i;
        break;
      }
    }
    if (bIndex < 0) {
      sourceList.appendChild(row);
      return;
    }
    var insertBeforeEl = null;
    for (var j = bIndex + 1; j < LANDSCAPE_BUCKETS.length; j += 1) {
      var k = LANDSCAPE_BUCKETS[j].key;
      var el = sourceList.querySelector('.source-row[data-landscape-bucket="' + k + '"]');
      if (el) {
        insertBeforeEl = el;
        break;
      }
    }
    var same = sourceList.querySelectorAll('.source-row[data-landscape-bucket="' + bucketKey + '"]');
    var last = same.length ? same[same.length - 1] : null;
    if (last) {
      if (last.nextSibling) {
        sourceList.insertBefore(row, last.nextSibling);
      } else {
        sourceList.appendChild(row);
      }
    } else if (insertBeforeEl) {
      sourceList.insertBefore(row, insertBeforeEl);
    } else {
      sourceList.appendChild(row);
    }
  }

  function setCategoryByLabel(row, label) {
    var sel = row.querySelector(".js-source-category");
    if (!sel) {
      return;
    }
    Array.prototype.forEach.call(sel.options, function (opt, idx) {
      if (String(opt.textContent || "").trim() === label) {
        sel.selectedIndex = idx;
      }
    });
  }

  function applyLandscapeTypeLock(row) {
    var sel = row.querySelector(".js-source-category");
    if (sel) {
      sel.disabled = false;
    }
  }

  function createAndBindRowForBucket(bucket) {
    if (bucket.segment) {
      var seg = buildUnstructuredSegmentRow();
      if (!seg) {
        return null;
      }
      appendRowInBucketPosition(seg, bucket.key);
      bindSegmentRow(seg);
      formatNumericFieldsIn(seg);
      return seg;
    }
    if (!rowTemplate) {
      return null;
    }
    var frag = rowTemplate.content.cloneNode(true);
    var row = frag.querySelector(".source-row");
    if (!row) {
      return null;
    }
    row.dataset.landscapeBucket = bucket.key;
    setCategoryByLabel(row, bucket.category);
    applyLandscapeTypeLock(row);
    appendRowInBucketPosition(row, bucket.key);
    bindSourceRow(row);
    var nameIn = row.querySelector(".js-source-name");
    if (nameIn) {
      nameIn.value = defaultDataSourceTitleForRow(row);
    }
    rebuildAdvancedDetails(row);
    formatNumericFieldsIn(row);
    updateRecordTotalLabel(row);
    updateRecordTotalForRow(row);
    return row;
  }

  function syncSourceRowsToBucketCounts() {
    if (!sourceList) {
      return;
    }
    LANDSCAPE_BUCKETS.forEach(function (b) {
      var target = readBucketTargetFromInput(b.key);
      var rows = Array.prototype.slice.call(
        sourceList.querySelectorAll('.source-row[data-landscape-bucket="' + b.key + '"]')
      );
      while (rows.length < target) {
        var created = createAndBindRowForBucket(b);
        if (!created) {
          break;
        }
        rows.push(created);
      }
      while (rows.length > target) {
        var rm = rows.pop();
        if (rm) {
          rm.remove();
        }
      }
    });
    syncRemoveButtons();
    document.querySelectorAll(".source-row").forEach(updateRecordTotalForRow);
    formatNumericFieldsIn(sourceList);
    updateDataSourcesBarCount();
    updateLandscapeSummary();
  }

  function stepBucketCount(bucketKey, delta) {
    var el = document.getElementById("landscape-count-" + bucketKey);
    if (!el) {
      return;
    }
    var v = parseLocaleNumber(el.value);
    if (isNaN(v)) {
      v = 0;
    }
    v = Math.max(0, Math.min(100, Math.floor(v) + delta));
    el.value = formatEnUSNumber(v);
    syncSourceRowsToBucketCounts();
  }

  function buildUnstructuredSegmentRow() {
    if (!rowTemplate) {
      return null;
    }
    var frag = rowTemplate.content.cloneNode(true);
    var r = frag.querySelector(".source-row");
    if (!r) {
      return null;
    }
    r.classList.add("source-row--segment");
    var sel = r.querySelector(".js-source-category");
    if (sel) {
      Array.prototype.forEach.call(sel.options, function (opt, idx) {
        if (String(opt.textContent || "").trim() === UNSTRUCTURED_CATEGORY) {
          sel.selectedIndex = idx;
        }
      });
    }
    var mp = r.querySelector(".js-profile-check");
    if (mp) {
      mp.checked = false;
    }
    var rt = r.querySelector(".js-record-total");
    if (rt) {
      rt.value = formatEnUSNumber(100);
    }
    var ci = r.querySelector(".js-counter-value");
    if (ci) {
      ci.value = formatEnUSNumber(1);
    }
    var nameIn = r.querySelector(".js-source-name");
    if (nameIn) {
      var nextIdx = sourceList ? sourceList.querySelectorAll(".source-row").length + 1 : 1;
      nameIn.value = "Source " + nextIdx;
    }
    r.dataset.landscapeBucket = "unstructured";
    return r;
  }

  function applySegmentRowLockedUI(segment) {
    var sel = segment.querySelector(".js-source-category");
    if (sel) {
      sel.disabled = true;
    }
    segment.querySelectorAll(".js-counter-dec, .js-counter-inc").forEach(function (b) {
      b.disabled = true;
    });
    var ci = segment.querySelector(".js-counter-value");
    if (ci) {
      ci.disabled = true;
    }
    var mp = segment.querySelector(".js-profile-check");
    if (mp) {
      mp.disabled = true;
    }
    var adv = segment.querySelector(".js-source-advanced");
    if (adv) {
      adv.disabled = true;
    }
    var rt = segment.querySelector(".js-record-total");
    if (rt) {
      rt.removeAttribute("readonly");
      rt.readOnly = false;
      rt.removeAttribute("aria-readonly");
      rt.title = "Total volume in megabytes (enter manually for this segment)";
      attachCommaFormatting(rt);
      rt.addEventListener("input", updateLandscapeSummary);
      rt.addEventListener("blur", updateLandscapeSummary);
    }
  }

  function applySourceTypeBehavior(row) {
    if (!row || row.classList.contains("source-row--segment")) {
      return;
    }
    var isUnstructured = getCategoryTypeLabel(row) === UNSTRUCTURED_CATEGORY;
    var dec = row.querySelector(".js-counter-dec");
    var inc = row.querySelector(".js-counter-inc");
    var ci = row.querySelector(".js-counter-value");
    var mp = row.querySelector(".js-profile-check");
    var advBtn = row.querySelector(".js-source-advanced");
    var advPanel = row.querySelector(".js-source-advanced-panel");
    var rt = row.querySelector(".js-record-total");
    var list = row.querySelector(".js-advanced-detail-list");

    if (isUnstructured) {
      row.classList.add("source-row--unstructured");
      if (ci) {
        ci.value = formatEnUSNumber(1);
        ci.disabled = true;
      }
      if (dec) {
        dec.disabled = true;
      }
      if (inc) {
        inc.disabled = true;
      }
      if (mp) {
        mp.checked = false;
        mp.disabled = true;
      }
      if (advBtn) {
        advBtn.disabled = true;
        advBtn.setAttribute("aria-expanded", "false");
      }
      if (advPanel) {
        advPanel.setAttribute("hidden", "");
      }
      row.classList.remove("source-row--expanded");
      if (list) {
        list.innerHTML = "";
      }
      if (rt) {
        rt.removeAttribute("readonly");
        rt.readOnly = false;
        rt.removeAttribute("aria-readonly");
        rt.title = RECORD_TOTAL_UNSTRUCTURED_TITLE;
        rt.value = formatEnUSNumber(100);
        attachCommaFormatting(rt);
        if (!rt.dataset.unstructuredBound) {
          rt.addEventListener("input", updateLandscapeSummary);
          rt.addEventListener("blur", updateLandscapeSummary);
          rt.dataset.unstructuredBound = "1";
        }
      }
      updateRecordTotalLabel(row);
      updateLandscapeSummary();
      return;
    }

    if (ci) {
      ci.disabled = false;
    }
    row.classList.remove("source-row--unstructured");
    if (dec) {
      dec.disabled = false;
    }
    if (inc) {
      inc.disabled = false;
    }
    if (mp) {
      mp.disabled = false;
    }
    if (advBtn) {
      advBtn.disabled = false;
    }
    if (rt) {
      rt.setAttribute("readonly", "");
      rt.readOnly = true;
      rt.setAttribute("aria-readonly", "true");
      rt.title = RECORD_TOTAL_READONLY_TITLE;
    }
    updateRecordTotalLabel(row);
    if (list && list.querySelector(".detail-subrow")) {
      updateRecordTotalForRow(row);
    } else {
      rebuildAdvancedDetails(row);
    }
  }

  function bindSegmentRow(segment) {
    ensureLandscapeSourceId(segment);
    applySegmentRowLockedUI(segment);
    updateRecordTotalLabel(segment);
    var removeBtn = segment.querySelector(".js-remove-source");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        segment.remove();
        syncRemoveButtons();
        updateLandscapeBucketInputsFromDom();
        updateLandscapeSummary();
      });
    }
  }

  function computeDefaultDetailVolumeSum(row) {
    var countInput = row.querySelector(".js-counter-value");
    if (!countInput) {
      return 0;
    }
    var n = Math.floor(parseLocaleNumber(countInput.value));
    if (isNaN(n) || n < 0) {
      n = 0;
    }
    var c = getCustomerCount();
    var mainOn =
      row.querySelector(".js-profile-check") && row.querySelector(".js-profile-check").checked;
    var sum = 0;
    for (var i = 0; i < n; i += 1) {
      var profiles = mainOn ? i === 0 : false;
      sum += profiles ? c : c * 10;
    }
    return sum;
  }

  function updateRecordTotalForRow(row) {
    if (row.classList.contains("source-row--segment")) {
      return;
    }
    var totalEl = row.querySelector(".js-record-total");
    if (!totalEl) {
      return;
    }
    if (getCategoryTypeLabel(row) === UNSTRUCTURED_CATEGORY) {
      updateLandscapeSummary();
      return;
    }
    var list = row.querySelector(".js-advanced-detail-list");
    var countInput = row.querySelector(".js-counter-value");
    var n = Math.floor(parseLocaleNumber(countInput && countInput.value));
    if (isNaN(n) || n < 0) {
      n = 0;
    }
    var detailCount = list ? list.querySelectorAll(".detail-subrow").length : 0;
    var sum = 0;
    if (detailCount > 0 && detailCount === n) {
      list.querySelectorAll(".js-detail-volume").forEach(function (inp) {
        var v = parseLocaleNumber(inp.value);
        if (!isNaN(v)) {
          sum += v;
        }
      });
    } else {
      sum = computeDefaultDetailVolumeSum(row);
    }
    totalEl.value = formatEnUSNumber(sum);
    updateLandscapeSummary();
  }

  function volumeForProfiles(checked) {
    var c = getCustomerCount();
    return checked ? c : c * 10;
  }

  function setVolumeFromRule(volInput, profilesChecked) {
    if (!volInput) {
      return;
    }
    var v = volumeForProfiles(profilesChecked);
    volInput.value = formatEnUSNumber(v);
  }

  function getDetailClassSelection(sub) {
    var profEl = sub.querySelector(".js-detail-profiles");
    var engEl = sub.querySelector(".js-detail-engagement");
    var othEl = sub.querySelector(".js-detail-other");
    if (profEl && profEl.checked) {
      return "profiles";
    }
    if (othEl && othEl.checked) {
      return "other";
    }
    if (engEl && engEl.checked) {
      return "engagement";
    }
    return "engagement";
  }

  function setDetailClassSelection(sub, classType) {
    var profEl = sub.querySelector(".js-detail-profiles");
    var engEl = sub.querySelector(".js-detail-engagement");
    var othEl = sub.querySelector(".js-detail-other");
    var t = classType === "profiles" || classType === "other" ? classType : "engagement";
    if (profEl) {
      profEl.checked = t === "profiles";
    }
    if (engEl) {
      engEl.checked = t === "engagement";
    }
    if (othEl) {
      othEl.checked = t === "other";
    }
  }

  function collectDetailState(listEl) {
    if (!listEl) {
      return [];
    }
    return Array.prototype.map.call(listEl.querySelectorAll(".detail-subrow"), function (sub) {
      var nameEl = sub.querySelector(".js-detail-name");
      var profEl = sub.querySelector(".js-detail-profiles");
      var volEl = sub.querySelector(".js-detail-volume");
      var cls = getDetailClassSelection(sub);
      return {
        name: nameEl ? nameEl.value : "",
        profiles: cls === "profiles",
        classType: cls,
        volume: volEl ? String(volEl.value || "").trim() : "",
      };
    });
  }

  function needsAdvancedDetailRebuild(row) {
    var list = row.querySelector(".js-advanced-detail-list");
    var countInput = row.querySelector(".js-counter-value");
    if (!list || !countInput || !detailSubrowTemplate) {
      return true;
    }
    var n = Math.floor(parseLocaleNumber(countInput.value));
    if (isNaN(n) || n < 0) {
      n = 0;
    }
    var detailCount = list.querySelectorAll(".detail-subrow").length;
    if (detailCount !== n) {
      return true;
    }
    if (n === 0) {
      return !list.querySelector(".detail-list__empty");
    }
    return false;
  }

  function getCategoryTypeLabel(row) {
    var sel = row.querySelector(".js-source-category");
    if (!sel || sel.selectedIndex < 0) {
      return "";
    }
    var opt = sel.options[sel.selectedIndex];
    return opt ? String(opt.textContent || "").trim() : "";
  }

  function updateRecordTotalLabel(row) {
    var label = row.querySelector(".js-record-total-label");
    if (!label) {
      return;
    }
    if (row.classList.contains("source-row--segment")) {
      label.textContent = "Total Volume in MB";
      return;
    }
    if (getCategoryTypeLabel(row) === UNSTRUCTURED_CATEGORY) {
      label.textContent = "Total Volume in MB";
    } else {
      label.textContent = "Total Rows";
    }
  }

  function computeCustomerRecordsProfileObjectSplit(row) {
    var list = row.querySelector(".js-advanced-detail-list");
    var countInput = row.querySelector(".js-counter-value");
    var n = Math.floor(parseLocaleNumber(countInput && countInput.value));
    if (isNaN(n) || n < 0) {
      n = 0;
    }
    var mainOn = row.querySelector(".js-profile-check") && row.querySelector(".js-profile-check").checked;
    var c = getCustomerCount();
    var profileSum = 0;
    var objectSum = 0;
    var detailCount = list ? list.querySelectorAll(".detail-subrow").length : 0;
    if (detailCount > 0 && detailCount === n) {
      Array.prototype.forEach.call(list.querySelectorAll(".detail-subrow"), function (sub) {
        var vol = sub.querySelector(".js-detail-volume");
        var prof = sub.querySelector(".js-detail-profiles");
        var v = parseLocaleNumber(vol && vol.value);
        if (isNaN(v)) {
          v = 0;
        }
        if (prof && prof.checked) {
          profileSum += v;
        } else {
          objectSum += v;
        }
      });
    } else {
      for (var i = 0; i < n; i += 1) {
        var profiles = mainOn && i === 0;
        if (profiles) {
          profileSum += c;
        } else {
          objectSum += c * 10;
        }
      }
    }
    return { profile: profileSum, object: objectSum };
  }

  function aggregateLandscapeSummary() {
    var totals = {
      profileRecords: 0,
      objectRecords: 0,
      streamingRecords: 0,
      subSecondRecords: 0,
      unstructuredMb: 0,
      zeroCopyRecords: 0,
    };
    if (!sourceList) {
      return totals;
    }
    sourceList.querySelectorAll(".source-row").forEach(function (row) {
      if (row.classList.contains("source-row--segment")) {
        var rtSeg = row.querySelector(".js-record-total");
        var t = parseLocaleNumber(rtSeg && rtSeg.value);
        if (!isNaN(t)) {
          totals.unstructuredMb += t;
        }
        return;
      }
      var cat = getCategoryTypeLabel(row);
      var rt = row.querySelector(".js-record-total");
      var v = parseLocaleNumber(rt && rt.value);
      if (isNaN(v)) {
        v = 0;
      }
      if (cat === CUSTOMER_RECORDS) {
        var split = computeCustomerRecordsProfileObjectSplit(row);
        totals.profileRecords += split.profile;
        totals.objectRecords += split.object;
      } else if (cat === STREAMING_EVENTS) {
        totals.streamingRecords += v;
      } else if (cat === SUB_SECOND_EVENTS) {
        totals.subSecondRecords += v;
      } else if (cat === UNSTRUCTURED_CATEGORY) {
        totals.unstructuredMb += v;
      } else if (cat === ZERO_COPY) {
        totals.zeroCopyRecords += v;
      }
    });
    return totals;
  }

  function updateLandscapeSummary() {
    var t = aggregateLandscapeSummary();
    var fmt = function (n) {
      return formatEnUSNumber(Math.round(n));
    };
    var p = document.querySelector(".js-landscape-profile-records");
    var o = document.querySelector(".js-landscape-object-records");
    var s = document.querySelector(".js-landscape-streaming-records");
    var ss = document.querySelector(".js-landscape-subsecond-records");
    var u = document.querySelector(".js-landscape-unstructured-mb");
    var zc = document.querySelector(".js-landscape-zerocopy-records");
    if (p) {
      p.textContent = fmt(t.profileRecords);
    }
    if (o) {
      o.textContent = fmt(t.objectRecords);
    }
    if (s) {
      s.textContent = fmt(t.streamingRecords);
    }
    if (ss) {
      ss.textContent = fmt(t.subSecondRecords);
    }
    if (u) {
      u.textContent = fmt(t.unstructuredMb);
    }
    if (zc) {
      zc.textContent = fmt(t.zeroCopyRecords);
    }
    var unifiedDd = document.querySelector(".js-landscape-unified-profiles");
    if (unifiedDd) {
      unifiedDd.textContent = fmt(collectIdentityUnifiedProfileTotals().total);
    }
    refreshAllLandscapePicks();
    updateSystemGeneratedData();
    var landscapeSysGenGrand = document.querySelector(".js-landscape-system-gen-grand-total");
    if (landscapeSysGenGrand) {
      landscapeSysGenGrand.textContent = fmt(systemGeneratedCatalogGrandTotal(getSystemGeneratedDataCatalog()));
    }
    updateDataSourcesBarCount();
  }

  function collectIdentityUnifiedProfileTotals() {
    var tbody = document.querySelector(".js-data-prep-tbody-identity");
    var items = [];
    var total = 0;
    if (!tbody) {
      return { total: total, items: items };
    }
    var mains = tbody.querySelectorAll("tr.data-prep-item__main");
    mains.forEach(function (tr, idx) {
      var uni = tr.querySelector(".js-data-prep-unified-profile-rows");
      var v = parseLocaleNumber(uni && uni.value);
      if (isNaN(v)) {
        v = 0;
      }
      total += v;
      var ne = tr.querySelector(".js-data-prep-name");
      var label = ne ? String(ne.value || "").trim() : "";
      if (!label) {
        label = "Identity Resolution " + (idx + 1);
      }
      items.push({ label: label, value: v });
    });
    return { total: total, items: items };
  }

  function collectPrepRowsByMainTbody(tbody, emptyLabelPrefix) {
    var items = [];
    var total = 0;
    if (!tbody) {
      return { total: total, items: items };
    }
    var mains = tbody.querySelectorAll("tr.data-prep-item__main");
    mains.forEach(function (tr, idx) {
      var rowsIn = tr.querySelector(".js-data-prep-rows");
      var v = parseLocaleNumber(rowsIn && rowsIn.value);
      if (isNaN(v)) {
        v = 0;
      }
      total += v;
      var ne = tr.querySelector(".js-data-prep-name");
      var label = ne ? String(ne.value || "").trim() : "";
      if (!label) {
        label = (emptyLabelPrefix || "Job") + " " + (idx + 1);
      }
      items.push({ label: label, value: v });
    });
    return { total: total, items: items };
  }

  function mainTrIsInsightStyle(mainTr) {
    return (
      !!mainTr &&
      (!!mainTr.closest(".js-data-prep-tbody-insights") || !!mainTr.closest(".js-data-prep-tbody-data-graphs"))
    );
  }

  function collectInsightStyleNewRowsFromTbody(tbodySelector, emptyLabelPrefix) {
    var tbody = document.querySelector(tbodySelector);
    var items = [];
    var total = 0;
    if (!tbody) {
      return { total: total, items: items };
    }
    var prefix = emptyLabelPrefix || "Insight";
    tbody.querySelectorAll("tr.data-prep-item__main").forEach(function (tr, idx) {
      var nir = tr.querySelector(".js-data-prep-insight-new-rows");
      var v = parseLocaleNumber(nir && nir.value);
      if (isNaN(v)) {
        v = 0;
      }
      total += v;
      var ne = tr.querySelector(".js-data-prep-name");
      var label = ne ? String(ne.value || "").trim() : "";
      if (!label) {
        label = prefix + " " + (idx + 1);
      }
      items.push({ label: label, value: v });
    });
    return { total: total, items: items };
  }

  function collectInsightNewRowsForSystemGen() {
    return collectInsightStyleNewRowsFromTbody(".js-data-prep-tbody-insights", "Calculated Insights");
  }

  function collectDataGraphNewRowsForSystemGen() {
    return collectInsightStyleNewRowsFromTbody(".js-data-prep-tbody-data-graphs", "Data Graph");
  }

  function collectTransformNewObjectRowsForSystemGen() {
    var tbody = document.querySelector(".js-data-prep-tbody-transforms");
    var items = [];
    var total = 0;
    if (!tbody) {
      return { total: total, items: items };
    }
    tbody.querySelectorAll("tr.data-prep-item__main").forEach(function (tr, idx) {
      var chk = tr.querySelector(".js-data-prep-output-new-object");
      var nov = tr.querySelector(".js-data-prep-new-object-rows");
      var v = 0;
      if (chk && chk.checked && nov) {
        v = parseLocaleNumber(nov.value);
        if (isNaN(v)) {
          v = 0;
        }
      }
      total += v;
      var ne = tr.querySelector(".js-data-prep-name");
      var label = ne ? String(ne.value || "").trim() : "";
      if (!label) {
        label = "Transform " + (idx + 1);
      }
      items.push({ label: label, value: v });
    });
    return { total: total, items: items };
  }

  function collectUnstructuredSegmentVolumes() {
    var items = [];
    var total = 0;
    if (!sourceList) {
      return { total: total, items: items };
    }
    sourceList.querySelectorAll(".source-row--segment").forEach(function (row, idx) {
      var rt = row.querySelector(".js-record-total");
      var v = parseLocaleNumber(rt && rt.value);
      if (isNaN(v)) {
        v = 0;
      }
      total += v;
      var ne = row.querySelector(".js-source-name");
      var label = ne ? String(ne.value || "").trim() : "";
      if (!label) {
        label = "Source " + (idx + 1);
      }
      items.push({ label: label, value: v, suffix: " MB" });
    });
    return { total: total, items: items };
  }

  function fillSystemGenSublist(ul, items, suffix) {
    if (!ul) {
      return;
    }
    ul.textContent = "";
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "system-gen-data__subrow";
      var spanL = document.createElement("span");
      spanL.className = "system-gen-data__subrow-label";
      spanL.textContent = it.label;
      spanL.title = it.label;
      li.appendChild(spanL);
      var spanV = document.createElement("span");
      spanV.className = "system-gen-data__subrow-value";
      var suf = it.suffix != null ? it.suffix : suffix || "";
      spanV.textContent = formatEnUSNumber(Math.round(it.value)) + suf;
      li.appendChild(spanV);
      ul.appendChild(li);
    });
  }

  /**
   * System Generated Data totals (same numbers as #system-gen-details-panel).
   * Use with getLandscapeCatalog() via getUnifiedDataCatalog() as the source of truth for formulas.
   */
  function getSystemGeneratedDataCatalog() {
    return {
      unifiedProfiles: collectIdentityUnifiedProfileTotals(),
      dataTransformOutputRows: collectTransformNewObjectRowsForSystemGen(),
      calculatedInsightsRows: collectInsightNewRowsForSystemGen(),
      dataGraphRows: collectDataGraphNewRowsForSystemGen(),
      unstructuredDataMb: collectUnstructuredSegmentVolumes(),
      segmentMembershipRows: { total: 0, items: [] },
    };
  }

  /** Landscape sources/objects plus system-generated metrics (single catalogue for downstream formulas). */
  function getUnifiedDataCatalog() {
    return {
      landscape: getLandscapeCatalog(),
      systemGenerated: getSystemGeneratedDataCatalog(),
    };
  }

  /** Grand total for System Generated Data bar (same sum as `.js-system-gen-total`). */
  function systemGeneratedCatalogGrandTotal(data) {
    return (
      data.unifiedProfiles.total +
      data.dataTransformOutputRows.total +
      data.dataGraphRows.total +
      data.calculatedInsightsRows.total +
      data.unstructuredDataMb.total +
      data.segmentMembershipRows.total
    );
  }

  /** Row-like totals from Data Prep tables (unified + transforms + graphs + insights; excludes MB). */
  function dataPrepBarTotalRows() {
    var d = getSystemGeneratedDataCatalog();
    return (
      d.unifiedProfiles.total +
      d.dataTransformOutputRows.total +
      d.dataGraphRows.total +
      d.calculatedInsightsRows.total
    );
  }

  function updateDataPrepBarTotal() {
    var el = document.querySelector(".js-data-prep-bar-total");
    if (!el) {
      return;
    }
    el.textContent = formatEnUSNumber(Math.round(dataPrepBarTotalRows()));
  }

  function updateSystemGeneratedData() {
    var wrap = document.querySelector(".js-system-gen-data-wrap");
    if (wrap) {
    var data = getSystemGeneratedDataCatalog();
    var unified = data.unifiedProfiles;
    var transforms = data.dataTransformOutputRows;
    var insights = data.calculatedInsightsRows;
    var dataGraphs = data.dataGraphRows;
    var unstructured = data.unstructuredDataMb;
    var segmentMembership = data.segmentMembershipRows;

    var fmt = function (n) {
      return formatEnUSNumber(Math.round(n));
    };

    var elUnifiedTotal = document.querySelector(".js-system-gen-unified-total");
    var elTransTotal = document.querySelector(".js-system-gen-transforms-total");
    var elInsightTotal = document.querySelector(".js-system-gen-insights-total");
    var elDataGraphsTotal = document.querySelector(".js-system-gen-data-graphs-total");
    var elUnstrTotal = document.querySelector(".js-system-gen-unstructured-total");
    var elSegTotal = document.querySelector(".js-system-gen-segment-total");
    var elGrand = document.querySelector(".js-system-gen-total");

    if (elUnifiedTotal) {
      elUnifiedTotal.textContent = fmt(unified.total);
    }
    if (elTransTotal) {
      elTransTotal.textContent = fmt(transforms.total);
    }
    if (elInsightTotal) {
      elInsightTotal.textContent = fmt(insights.total);
    }
    if (elDataGraphsTotal) {
      elDataGraphsTotal.textContent = fmt(dataGraphs.total);
    }
    if (elUnstrTotal) {
      elUnstrTotal.textContent = fmt(unstructured.total);
    }
    if (elSegTotal) {
      elSegTotal.textContent = fmt(segmentMembership.total);
    }

    fillSystemGenSublist(document.querySelector(".js-system-gen-unified-list"), unified.items, "");
    fillSystemGenSublist(document.querySelector(".js-system-gen-transforms-list"), transforms.items, "");
    fillSystemGenSublist(document.querySelector(".js-system-gen-data-graphs-list"), dataGraphs.items, "");
    fillSystemGenSublist(document.querySelector(".js-system-gen-insights-list"), insights.items, "");
    fillSystemGenSublist(document.querySelector(".js-system-gen-unstructured-list"), unstructured.items, "");
    fillSystemGenSublist(document.querySelector(".js-system-gen-segment-list"), segmentMembership.items, "");

    var grand = systemGeneratedCatalogGrandTotal(data);
    if (elGrand) {
      elGrand.textContent = fmt(grand);
    }
    syncAllInsightNewRowsFields();
    }
    updateDataPrepBarTotal();
    syncDataPrepQuestionsFromDom();
  }

  function ensureLandscapeSourceId(row) {
    if (!row || row.dataset.landscapeSourceId) {
      return;
    }
    landscapeSourceSeq += 1;
    row.dataset.landscapeSourceId = "lsrc-" + landscapeSourceSeq;
  }

  function defaultUnstructuredSourceTitleForRow(row) {
    if (!sourceList || !row || !row.classList.contains("source-row--segment")) {
      return "Source 1";
    }
    var rows = sourceList.querySelectorAll(".source-row");
    var n = 0;
    for (var i = 0; i < rows.length; i += 1) {
      n += 1;
      if (rows[i] === row) {
        return "Source " + n;
      }
    }
    return "Source " + Math.max(1, n);
  }

  function defaultDataSourceTitleForRow(row) {
    if (!sourceList || !row || row.classList.contains("source-row--segment")) {
      return "Source 1";
    }
    var rows = sourceList.querySelectorAll(".source-row");
    var n = 0;
    for (var i = 0; i < rows.length; i += 1) {
      n += 1;
      if (rows[i] === row) {
        return "Source " + n;
      }
    }
    return "Source " + Math.max(1, n);
  }

  function getLandscapeCatalog() {
    if (!sourceList) {
      return [];
    }
    if (!dataLandscapeSeeded && currentStep >= 2) {
      ensureDataLandscapeRows();
    }
    var list = [];
    sourceList.querySelectorAll(".source-row").forEach(function (row) {
      ensureLandscapeSourceId(row);
      var sid = row.dataset.landscapeSourceId;
      var nameIn = row.querySelector(".js-source-name");
      var rawName = nameIn ? String(nameIn.value || "").trim() : "";
      var displayName = row.classList.contains("source-row--segment")
        ? rawName || defaultUnstructuredSourceTitleForRow(row)
        : rawName || defaultDataSourceTitleForRow(row);
      var dataType = getCategoryTypeLabel(row);
      var mainProfiles =
        row.querySelector(".js-profile-check") && row.querySelector(".js-profile-check").checked;
      var totalRt = row.querySelector(".js-record-total");
      var totalRows = parseLocaleNumber(totalRt && totalRt.value);
      if (isNaN(totalRows)) {
        totalRows = 0;
      }
      var objects = [];
      if (row.classList.contains("source-row--segment")) {
        objects.push({
          pickId: sid + "#0",
          slotIndex: 0,
          label: "Unstructured volume",
          profiles: false,
          rows: totalRows,
        });
        list.push({
          sourceId: sid,
          name: displayName,
          dataType: dataType,
          mainProfiles: mainProfiles,
          totalRows: totalRows,
          objects: objects,
          isSegment: true,
        });
        return;
      }
      row.querySelectorAll(".js-advanced-detail-list .detail-subrow").forEach(function (sub, idx) {
        var ne = sub.querySelector(".js-detail-name");
        var pe = sub.querySelector(".js-detail-profiles");
        var vol = sub.querySelector(".js-detail-volume");
        var objLabel = ne ? String(ne.value || "").trim() : "";
        if (!objLabel) {
          var profOn = pe && pe.checked;
          objLabel = getDetailNamePreset(row, idx, profOn);
        }
        var rows = parseLocaleNumber(vol && vol.value);
        if (isNaN(rows)) {
          rows = 0;
        }
        objects.push({
          pickId: sid + "#" + idx,
          slotIndex: idx,
          label: objLabel,
          profiles: !!(pe && pe.checked),
          rows: rows,
        });
      });
      list.push({
        sourceId: sid,
        name: displayName,
        dataType: dataType,
        mainProfiles: mainProfiles,
        totalRows: totalRows,
        objects: objects,
        isSegment: false,
      });
    });
    return list;
  }

  function catalogValidPickSet(catalog) {
    var valid = {};
    catalog.forEach(function (src) {
      if (src.objects.length > 0) {
        src.objects.forEach(function (o) {
          valid[o.pickId] = true;
        });
      } else if (!src.isSegment) {
        valid[src.sourceId + ":whole"] = true;
      }
    });
    return valid;
  }

  function normalizePickList(ids, catalog) {
    var bySource = {};
    catalog.forEach(function (src) {
      bySource[src.sourceId] = src;
    });
    var expanded = [];
    (ids || []).forEach(function (id) {
      if (!id || typeof id !== "string") {
        return;
      }
      var wholeKey = ":whole";
      if (id.slice(-wholeKey.length) === wholeKey) {
        var sid = id.slice(0, -wholeKey.length);
        var src = bySource[sid];
        if (!src) {
          return;
        }
        if (src.objects.length > 0) {
          src.objects.forEach(function (o) {
            expanded.push(o.pickId);
          });
        } else {
          expanded.push(id);
        }
        return;
      }
      expanded.push(id);
    });
    var valid = catalogValidPickSet(catalog);
    var seen = {};
    var out = [];
    expanded.forEach(function (id) {
      if (valid[id] && !seen[id]) {
        seen[id] = true;
        out.push(id);
      }
    });
    return out;
  }

  function sumRowsForLandscapePicks(ids, catalog) {
    var cat = catalog || getLandscapeCatalog();
    var picks = normalizePickList(ids || [], cat);
    var sum = 0;
    var wholeSuffix = ":whole";
    picks.forEach(function (id) {
      if (!id) {
        return;
      }
      if (id.slice(-wholeSuffix.length) === wholeSuffix) {
        var sid = id.slice(0, -wholeSuffix.length);
        var src = null;
        for (var i = 0; i < cat.length; i += 1) {
          if (cat[i].sourceId === sid) {
            src = cat[i];
            break;
          }
        }
        if (!src) {
          return;
        }
        if (src.objects.length > 0) {
          src.objects.forEach(function (o) {
            var r = Number(o.rows);
            sum += isNaN(r) ? 0 : r;
          });
        } else {
          var t = Number(src.totalRows);
          sum += isNaN(t) ? 0 : t;
        }
        return;
      }
      for (var j = 0; j < cat.length; j += 1) {
        var s = cat[j];
        for (var k = 0; k < s.objects.length; k += 1) {
          if (s.objects[k].pickId === id) {
            var v = Number(s.objects[k].rows);
            sum += isNaN(v) ? 0 : v;
            return;
          }
        }
      }
    });
    return sum;
  }

  /** Sum of all row volumes across the full Data Landscape (for transform % sizing). */
  function getTotalLandscapeRowCount(catalog) {
    var cat = catalog || getLandscapeCatalog();
    var sum = 0;
    cat.forEach(function (src) {
      if (src.isSegment) {
        var r0 = src.objects[0] ? Number(src.objects[0].rows) : Number(src.totalRows);
        sum += isNaN(r0) ? 0 : r0;
        return;
      }
      if (src.objects.length > 0) {
        src.objects.forEach(function (o) {
          var v = Number(o.rows);
          sum += isNaN(v) ? 0 : v;
        });
      } else {
        var t = Number(src.totalRows);
        sum += isNaN(t) ? 0 : t;
      }
    });
    return sum;
  }

  /** Mean row volume among landscape objects flagged as Profiles (for Calculated Insights / Data Graphs % formula). */
  function getAverageProfileObjectRowSize(catalog) {
    var cat = catalog || getLandscapeCatalog();
    var sum = 0;
    var n = 0;
    cat.forEach(function (src) {
      if (src.isSegment) {
        return;
      }
      (src.objects || []).forEach(function (o) {
        if (o.profiles) {
          var v = Number(o.rows);
          if (!isNaN(v)) {
            sum += v;
            n += 1;
          }
        }
      });
    });
    if (n === 0) {
      return 0;
    }
    return sum / n;
  }

  function syncDataPrepRowsFromLandscapePick(pickRoot) {
    if (!pickRoot) {
      return;
    }
    var panel = pickRoot.closest(".js-data-prep-advanced-panel");
    if (!panel) {
      return;
    }
    var advTr = panel.closest("tr");
    if (!advTr) {
      return;
    }
    var mainTr = advTr.previousElementSibling;
    if (!mainTr || !mainTr.classList.contains("data-prep-item__main")) {
      return;
    }
    var rowsInput = mainTr.querySelector(".js-data-prep-rows");
    if (!rowsInput) {
      return;
    }
    if (mainTr.closest(".js-data-prep-tbody-identity")) {
      var panelId = pickRoot.closest(".js-data-prep-advanced-panel");
      var useAllProfiles = panelId && panelId.querySelector(".js-data-prep-identity-use-all-profiles");
      if (useAllProfiles && useAllProfiles.checked) {
        return;
      }
    }
    if (
      mainTr.closest(".js-data-prep-tbody-transforms") ||
      mainTrIsInsightStyle(mainTr)
    ) {
      var panelForMode = pickRoot.closest(".js-data-prep-advanced-panel");
      var usePickMode = panelForMode && panelForMode.querySelector(".js-data-prep-transform-use-pick");
      if (usePickMode && !usePickMode.checked) {
        return;
      }
    }
    var hidden = pickRoot.querySelector(".js-landscape-pick-value");
    if (!hidden) {
      return;
    }
    var cat = getLandscapeCatalog();
    var ids = normalizePickList(readPickIdsFromHidden(hidden), cat);
    var total = sumRowsForLandscapePicks(ids, cat);
    rowsInput.value = formatEnUSNumber(Math.round(total));
  }

  function readPickIdsFromHidden(hidden) {
    if (!hidden || !String(hidden.value || "").trim()) {
      return [];
    }
    try {
      var data = JSON.parse(hidden.value);
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.picks)) {
        return data.picks;
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  function writePickIdsToHidden(hidden, ids) {
    if (!hidden) {
      return;
    }
    hidden.value = JSON.stringify({ picks: ids });
  }

  function labelForPickId(id, catalog) {
    var wholeKey = ":whole";
    if (id.slice(-wholeKey.length) === wholeKey) {
      var sid = id.slice(0, -wholeKey.length);
      for (var i = 0; i < catalog.length; i += 1) {
        if (catalog[i].sourceId === sid) {
          return catalog[i].name + " (entire source)";
        }
      }
      return id;
    }
    for (var j = 0; j < catalog.length; j += 1) {
      var src = catalog[j];
      for (var k = 0; k < src.objects.length; k += 1) {
        if (src.objects[k].pickId === id) {
          return src.name + " — " + src.objects[k].label;
        }
      }
    }
    return id;
  }

  function summarizePickSelection(ids, catalog) {
    if (!ids || ids.length === 0) {
      return "";
    }
    var labels = ids.map(function (id) {
      return labelForPickId(id, catalog);
    });
    if (labels.length <= 2) {
      return labels.join("; ");
    }
    return String(labels.length) + " selected: " + labels.slice(0, 2).join("; ") + "…";
  }

  function closeLandscapePickUi(root) {
    if (!root) {
      return;
    }
    root.classList.remove("landscape-pick--open");
    var menu = root.querySelector(".js-landscape-pick-menu");
    var toggle = root.querySelector(".js-landscape-pick-toggle");
    if (menu) {
      menu.hidden = true;
    }
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  function updateIdentitySizingColumnsVisual(panel) {
    if (!panel) {
      return;
    }
    var colAll = panel.querySelector(".js-data-prep-identity-col-all");
    var colPick = panel.querySelector(".js-data-prep-identity-col-pick");
    var useAll = panel.querySelector(".js-data-prep-identity-use-all-profiles");
    if (!colAll || !colPick || !useAll) {
      return;
    }
    var allActive = !!useAll.checked;
    colAll.classList.toggle("data-prep-identity-sizing__col--active", allActive);
    colAll.classList.toggle("data-prep-identity-sizing__col--dim", !allActive);
    colPick.classList.toggle("data-prep-identity-sizing__col--active", !allActive);
    colPick.classList.toggle("data-prep-identity-sizing__col--dim", allActive);
  }

  function syncIdentityProfilesProcessedFromMode(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!panel) {
      return;
    }
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    if (!rowsIn) {
      return;
    }
    var useAll = panel.querySelector(".js-data-prep-identity-use-all-profiles");
    if (useAll && useAll.checked) {
      var t = aggregateLandscapeSummary().profileRecords;
      rowsIn.value = formatEnUSNumber(Math.round(t));
      return;
    }
    var pickRoot = panel.querySelector(".js-landscape-pick");
    if (pickRoot) {
      syncDataPrepRowsFromLandscapePick(pickRoot);
    }
  }

  function bindIdentityProfilesInputSource(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!panel) {
      return;
    }
    var useAll = panel.querySelector(".js-data-prep-identity-use-all-profiles");
    var usePick = panel.querySelector(".js-data-prep-identity-use-pick");
    if (!useAll || !usePick) {
      return;
    }

    function onModeChange() {
      updateIdentitySizingColumnsVisual(panel);
      syncIdentityProfilesProcessedFromMode(mainTr, advTr);
      updateSystemGeneratedData();
    }

    useAll.addEventListener("change", function () {
      if (useAll.checked) {
        usePick.checked = false;
      } else {
        usePick.checked = true;
      }
      onModeChange();
    });
    usePick.addEventListener("change", function () {
      if (usePick.checked) {
        useAll.checked = false;
      } else {
        useAll.checked = true;
      }
      onModeChange();
    });

    updateIdentitySizingColumnsVisual(panel);
    syncIdentityProfilesProcessedFromMode(mainTr, advTr);
  }

  function syncAllIdentityProfilesFromLandscape() {
    var tbody = document.querySelector(".js-data-prep-tbody-identity");
    if (!tbody) {
      return;
    }
    tbody.querySelectorAll("tr.data-prep-item__main").forEach(function (mainTr) {
      var advTr = mainTr.nextElementSibling;
      if (!advTr || !advTr.classList.contains("data-prep-item__advanced")) {
        return;
      }
      var useAll = advTr.querySelector(".js-data-prep-identity-use-all-profiles");
      if (useAll && useAll.checked) {
        syncIdentityProfilesProcessedFromMode(mainTr, advTr);
      }
    });
  }

  function refreshAllLandscapePicks() {
    document.querySelectorAll(".js-landscape-pick").forEach(function (root) {
      var fn = root._landscapePickRefresh;
      if (typeof fn === "function") {
        fn();
      }
    });
    syncAllDualSizingPercentRows();
    syncAllInsightNewRowsFields();
    syncAllIdentityProfilesFromLandscape();
    syncAllSolutionStreamingRows();
  }

  function updateTransformSizingColumnsVisual(panel) {
    if (!panel) {
      return;
    }
    var colPct = panel.querySelector(".js-data-prep-transform-col-percent");
    var colPick = panel.querySelector(".js-data-prep-transform-col-pick");
    var usePct = panel.querySelector(".js-data-prep-transform-use-percent");
    if (!colPct || !colPick || !usePct) {
      return;
    }
    var pctActive = !!usePct.checked;
    colPct.classList.toggle("data-prep-transform-sizing__col--active", pctActive);
    colPct.classList.toggle("data-prep-transform-sizing__col--dim", !pctActive);
    colPick.classList.toggle("data-prep-transform-sizing__col--active", !pctActive);
    colPick.classList.toggle("data-prep-transform-sizing__col--dim", pctActive);
  }

  function syncTransformRowsFromPercent(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!panel) {
      return;
    }
    var usePct = panel.querySelector(".js-data-prep-transform-use-percent");
    if (!usePct || !usePct.checked) {
      return;
    }
    var pctIn = panel.querySelector(".js-data-prep-transform-pct-of-landscape");
    var rowsInput = mainTr.querySelector(".js-data-prep-rows");
    if (!rowsInput) {
      return;
    }
    var raw = pctIn ? String(pctIn.value || "").replace(/%/g, "").replace(/,/g, "").trim() : "";
    var pct = parseFloat(raw);
    if (isNaN(pct)) {
      pct = 0;
    }
    pct = Math.max(0, Math.min(100, pct));
    var cat = getLandscapeCatalog();
    var total = getTotalLandscapeRowCount(cat);
    var percentPart = Math.round(total * (pct / 100));
    var rows;
    if (mainTrIsInsightStyle(mainTr)) {
      var aggSel = mainTr.querySelector(".js-data-prep-insight-aggregate-object");
      var idx = aggSel ? aggSel.selectedIndex : 0;
      if (idx === 1) {
        var profSum = aggregateLandscapeSummary().profileRecords;
        var sysGen = getSystemGeneratedDataCatalog();
        var uniPart = sysGen.unifiedProfiles.total;
        rows = Math.round(percentPart + profSum + uniPart);
      } else if (idx === 2) {
        rows = percentPart;
      } else {
        rows = Math.round(percentPart + getAverageProfileObjectRowSize(cat));
      }
    } else {
      rows = percentPart;
    }
    rowsInput.value = formatEnUSNumber(rows);
  }

  function syncTransformRowsForCurrentMode(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!panel) {
      return;
    }
    var usePct = panel.querySelector(".js-data-prep-transform-use-percent");
    if (usePct && usePct.checked) {
      syncTransformRowsFromPercent(mainTr, advTr);
    } else {
      var pickRoot = panel.querySelector(".js-landscape-pick");
      if (pickRoot) {
        syncDataPrepRowsFromLandscapePick(pickRoot);
      }
    }
  }

  function syncAllDualSizingPercentRows() {
    function runForTbody(sel) {
      var tbody = document.querySelector(sel);
      if (!tbody) {
        return;
      }
      tbody.querySelectorAll("tr.data-prep-item__main").forEach(function (mainTr) {
        var advTr = mainTr.nextElementSibling;
        if (!advTr || !advTr.classList.contains("data-prep-item__advanced")) {
          return;
        }
        var usePct = advTr.querySelector(".js-data-prep-transform-use-percent");
        if (usePct && usePct.checked) {
          syncTransformRowsFromPercent(mainTr, advTr);
        }
      });
    }
    runForTbody(".js-data-prep-tbody-transforms");
    runForTbody(".js-data-prep-tbody-insights");
    runForTbody(".js-data-prep-tbody-data-graphs");
  }

  /** Calculated Insights: New Insights Rows — formula unless Aggregate Data is Other. */
  function syncInsightNewRowsField(mainTr) {
    if (!mainTr || !mainTrIsInsightStyle(mainTr)) {
      return;
    }
    var aggSel = mainTr.querySelector(".js-data-prep-insight-aggregate-object");
    var nir = mainTr.querySelector(".js-data-prep-insight-new-rows");
    if (!nir || !aggSel) {
      return;
    }
    var idx = aggSel.selectedIndex;
    var cat = getLandscapeCatalog();
    if (idx === 2) {
      nir.readOnly = false;
      nir.removeAttribute("aria-disabled");
      nir.removeAttribute("data-readonly-computed");
      nir.setAttribute("aria-label", "New insights rows");
      if (nir.getAttribute("data-comma-format") !== "1") {
        attachCommaFormatting(nir);
      }
      if (!nir._insightNewRowsInputBound) {
        nir._insightNewRowsInputBound = true;
        nir.addEventListener("input", updateSystemGeneratedData);
        nir.addEventListener("blur", updateSystemGeneratedData);
      }
    } else {
      nir.readOnly = true;
      nir.setAttribute("aria-disabled", "true");
      nir.setAttribute("data-readonly-computed", "1");
      nir.setAttribute(
        "aria-label",
        "New insights rows (computed from Aggregate Data; select Other to edit)"
      );
      var v = 0;
      if (idx === 1) {
        v = getSystemGeneratedDataCatalog().unifiedProfiles.total;
      } else {
        v = getAverageProfileObjectRowSize(cat);
      }
      nir.value = formatEnUSNumber(Math.round(v));
    }
  }

  function syncAllInsightNewRowsFields() {
    [".js-data-prep-tbody-insights", ".js-data-prep-tbody-data-graphs"].forEach(function (sel) {
      var tbody = document.querySelector(sel);
      if (!tbody) {
        return;
      }
      tbody.querySelectorAll("tr.data-prep-item__main").forEach(syncInsightNewRowsField);
    });
  }

  function bindDataPrepDualSizingAdvanced(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!panel) {
      return;
    }
    var usePct = panel.querySelector(".js-data-prep-transform-use-percent");
    var usePick = panel.querySelector(".js-data-prep-transform-use-pick");
    var pctIn = panel.querySelector(".js-data-prep-transform-pct-of-landscape");
    if (!usePct || !usePick) {
      return;
    }

    function expandAdvIfCollapsed() {
      if (advTr.hasAttribute("hidden")) {
        advTr.removeAttribute("hidden");
        var editBtn = mainTr.querySelector(".js-data-prep-edit");
        if (editBtn) {
          editBtn.setAttribute("aria-expanded", "true");
        }
        mainTr.classList.add("data-prep-item--expanded");
      }
    }

    function onModeChange() {
      updateTransformSizingColumnsVisual(panel);
      syncTransformRowsForCurrentMode(mainTr, advTr);
      updateSystemGeneratedData();
    }

    usePct.addEventListener("change", function () {
      if (usePct.checked) {
        usePick.checked = false;
      } else {
        usePick.checked = true;
      }
      onModeChange();
    });
    usePick.addEventListener("change", function () {
      if (usePick.checked) {
        usePct.checked = false;
      } else {
        usePct.checked = true;
      }
      onModeChange();
    });

    if (pctIn) {
      pctIn.addEventListener("input", function () {
        if (usePct.checked) {
          syncTransformRowsFromPercent(mainTr, advTr);
          updateSystemGeneratedData();
        }
      });
      pctIn.addEventListener("blur", function () {
        if (usePct.checked) {
          syncTransformRowsFromPercent(mainTr, advTr);
          updateSystemGeneratedData();
        }
      });
      pctIn.addEventListener("focusin", expandAdvIfCollapsed);
    }

    if (mainTrIsInsightStyle(mainTr)) {
      var aggSel = mainTr.querySelector(".js-data-prep-insight-aggregate-object");
      if (aggSel) {
        aggSel.addEventListener("change", function () {
          syncInsightNewRowsField(mainTr);
          if (usePct.checked) {
            syncTransformRowsFromPercent(mainTr, advTr);
          }
          updateSystemGeneratedData();
        });
      }
    }

    updateTransformSizingColumnsVisual(panel);
    syncTransformRowsForCurrentMode(mainTr, advTr);
  }

  function initLandscapePick(root) {
    if (!root || root.getAttribute("data-landscape-pick-bound") === "1") {
      return;
    }
    var hidden = root.querySelector(".js-landscape-pick-value");
    var toggle = root.querySelector(".js-landscape-pick-toggle");
    var summary = root.querySelector(".js-landscape-pick-summary");
    var menu = root.querySelector(".js-landscape-pick-menu");
    if (!hidden || !toggle || !summary || !menu) {
      return;
    }
    root.setAttribute("data-landscape-pick-bound", "1");
    landscapePickMenuUid += 1;
    menu.id = "landscape-pick-menu-" + landscapePickMenuUid;
    toggle.setAttribute("aria-controls", menu.id);

    function getIds() {
      var cat = getLandscapeCatalog();
      return normalizePickList(readPickIdsFromHidden(hidden), cat);
    }

    function setIds(ids) {
      var cat = getLandscapeCatalog();
      var next = normalizePickList(ids, cat);
      writePickIdsToHidden(hidden, next);
      refreshSummary();
      if (!menu.hidden) {
        renderMenu();
      }
    }

    function refreshSummary() {
      var cat = getLandscapeCatalog();
      var ids = normalizePickList(readPickIdsFromHidden(hidden), cat);
      if (ids.length === 0) {
        summary.textContent = "Select sources or objects…";
        summary.classList.add("landscape-pick__summary--placeholder");
      } else {
        summary.textContent = summarizePickSelection(ids, cat);
        summary.classList.remove("landscape-pick__summary--placeholder");
      }
      syncDataPrepRowsFromLandscapePick(root);
    }

    function renderMenu() {
      var cat = getLandscapeCatalog();
      var ids = normalizePickList(readPickIdsFromHidden(hidden), cat);
      var selected = {};
      ids.forEach(function (id) {
        selected[id] = true;
      });
      menu.innerHTML = "";
      if (cat.length === 0) {
        var empty = document.createElement("p");
        empty.className = "landscape-pick__empty";
        empty.textContent = "Add data sources in the Data Landscape step to choose inputs here.";
        menu.appendChild(empty);
        return;
      }
      cat.forEach(function (src) {
        var group = document.createElement("div");
        group.className = "landscape-pick__group";
        if (src.objects.length === 0 && !src.isSegment) {
          var row0 = document.createElement("div");
          row0.className = "landscape-pick__source-row";
          var wholeId = src.sourceId + ":whole";
          var lab0 = document.createElement("label");
          lab0.className = "check-row";
          var cb0 = document.createElement("input");
          cb0.type = "checkbox";
          cb0.className = "check-row__input";
          cb0.checked = !!selected[wholeId];
          var txt0 = document.createElement("span");
          txt0.className = "check-row__text";
          txt0.innerHTML =
            "<strong>" +
            escapeHtml(src.name) +
            "</strong><span class=\"landscape-pick__source-meta\">" +
            escapeHtml(src.dataType) +
            " · Open <strong>Edit</strong> to list individual objects for granular selection.</span>";
          lab0.appendChild(cb0);
          lab0.appendChild(txt0);
          cb0.addEventListener("change", function () {
            var cur = getIds();
            if (cb0.checked) {
              if (cur.indexOf(wholeId) < 0) {
                cur.push(wholeId);
              }
            } else {
              cur = cur.filter(function (x) {
                return x !== wholeId;
              });
            }
            setIds(cur);
          });
          row0.appendChild(lab0);
          group.appendChild(row0);
          menu.appendChild(group);
          return;
        }
        var srcRow = document.createElement("div");
        srcRow.className = "landscape-pick__source-row";
        var srcLab = document.createElement("label");
        srcLab.className = "check-row";
        var srcCb = document.createElement("input");
        srcCb.type = "checkbox";
        srcCb.className = "check-row__input";
        var objIds = src.objects.map(function (o) {
          return o.pickId;
        });
        var allOn =
          objIds.length > 0 &&
          objIds.every(function (pid) {
            return selected[pid];
          });
        var someOn =
          objIds.some(function (pid) {
            return selected[pid];
          });
        srcCb.checked = allOn;
        srcCb.indeterminate = !allOn && someOn;
        var srcTxt = document.createElement("span");
        srcTxt.className = "check-row__text";
        srcTxt.innerHTML =
          "<strong>" +
          escapeHtml(src.name) +
          "</strong><span class=\"landscape-pick__source-meta\">" +
          escapeHtml(src.dataType) +
          " · " +
          formatEnUSNumber(Math.round(src.totalRows)) +
          " " +
          (src.dataType === UNSTRUCTURED_CATEGORY ? "MB" : "rows (source total)") +
          (src.mainProfiles ? " · Source-level profiles on" : "") +
          "</span>";
        srcLab.appendChild(srcCb);
        srcLab.appendChild(srcTxt);
        srcCb.addEventListener("change", function () {
          var cur = getIds().filter(function (id) {
            return objIds.indexOf(id) < 0;
          });
          if (srcCb.checked) {
            objIds.forEach(function (pid) {
              if (cur.indexOf(pid) < 0) {
                cur.push(pid);
              }
            });
          }
          setIds(cur);
        });
        srcRow.appendChild(srcLab);
        group.appendChild(srcRow);
        src.objects.forEach(function (obj) {
          var orow = document.createElement("div");
          orow.className = "landscape-pick__object-row";
          var olab = document.createElement("label");
          olab.className = "check-row";
          var ocb = document.createElement("input");
          ocb.type = "checkbox";
          ocb.className = "check-row__input";
          ocb.checked = !!selected[obj.pickId];
          var otxt = document.createElement("span");
          otxt.className = "check-row__text";
          otxt.innerHTML =
            "<strong>" +
            escapeHtml(obj.label) +
            "</strong><span class=\"landscape-pick__object-detail\">" +
            (obj.profiles ? "Profiles" : "No profiles") +
            " · " +
            formatEnUSNumber(Math.round(obj.rows)) +
            " " +
            (src.dataType === UNSTRUCTURED_CATEGORY ? "MB" : "rows") +
            "</span>";
          olab.appendChild(ocb);
          olab.appendChild(otxt);
          ocb.addEventListener("change", function () {
            var cur = getIds().filter(function (id) {
              return id !== obj.pickId;
            });
            if (ocb.checked) {
              cur.push(obj.pickId);
            }
            setIds(cur);
          });
          orow.appendChild(olab);
          group.appendChild(orow);
        });
        menu.appendChild(group);
      });
    }

    function escapeHtml(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = root.classList.contains("landscape-pick--open");
      document.querySelectorAll(".landscape-pick--open").forEach(function (other) {
        if (other !== root) {
          closeLandscapePickUi(other);
        }
      });
      if (open) {
        closeLandscapePickUi(root);
      } else {
        root.classList.add("landscape-pick--open");
        menu.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        renderMenu();
      }
    });

    menu.addEventListener("mousedown", function (ev) {
      ev.stopPropagation();
    });

    root._landscapePickRefresh = function () {
      var cat = getLandscapeCatalog();
      var fixed = normalizePickList(readPickIdsFromHidden(hidden), cat);
      writePickIdsToHidden(hidden, fixed);
      refreshSummary();
      if (!menu.hidden) {
        renderMenu();
      }
    };

    refreshSummary();
  }

  document.addEventListener(
    "mousedown",
    function (ev) {
      if (ev.button !== 0) {
        return;
      }
      var t = ev.target;
      if (t && t.closest && t.closest(".landscape-pick")) {
        return;
      }
      document.querySelectorAll(".landscape-pick--open").forEach(function (r) {
        closeLandscapePickUi(r);
      });
    },
    true
  );

  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") {
      return;
    }
    document.querySelectorAll(".landscape-pick--open").forEach(function (r) {
      closeLandscapePickUi(r);
    });
    closeSolutionTemplateMenu();
  });

  function syncDetailProfilesFromMain(row) {
    var list = row.querySelector(".js-advanced-detail-list");
    if (!list) {
      updateRecordTotalForRow(row);
      return;
    }
    var subs = list.querySelectorAll(".detail-subrow");
    if (subs.length === 0) {
      updateRecordTotalForRow(row);
      return;
    }
    var mainOn = row.querySelector(".js-profile-check") && row.querySelector(".js-profile-check").checked;
    Array.prototype.forEach.call(subs, function (sub, idx) {
      var ne = sub.querySelector(".js-detail-name");
      var vol = sub.querySelector(".js-detail-volume");
      if (mainOn) {
        setDetailClassSelection(sub, idx === 0 ? "profiles" : "engagement");
      } else {
        setDetailClassSelection(sub, "engagement");
      }
      var isProfiles = getDetailClassSelection(sub) === "profiles";
      if (vol) {
        setVolumeFromRule(vol, isProfiles);
      }
      if (ne) {
        ne.value = getDetailNamePreset(row, idx, isProfiles);
      }
    });
    updateRecordTotalForRow(row);
  }

  function getDetailNamePreset(row, indexZeroBased, profilesChecked) {
    var n = indexZeroBased + 1;
    if (profilesChecked) {
      return "Profile " + n;
    }
    var cat = getCategoryTypeLabel(row);
    if (cat === "Streaming Events" || cat === "Sub-Second Events") {
      return "Stream " + n;
    }
    return "Object " + n;
  }

  function rebuildAdvancedDetails(row) {
    var list = row.querySelector(".js-advanced-detail-list");
    var countInput = row.querySelector(".js-counter-value");
    if (!list || !countInput || !detailSubrowTemplate) {
      return;
    }
    var n = Math.floor(parseLocaleNumber(countInput.value));
    if (isNaN(n) || n < 0) {
      n = 0;
    }
    var prev = collectDetailState(list);
    list.innerHTML = "";
    if (n === 0) {
      var empty = document.createElement("p");
      empty.className = "detail-list__empty";
      empty.textContent =
        "Set “Number of Objects or Streams” above to add detail rows.";
      list.appendChild(empty);
      updateRecordTotalForRow(row);
      return;
    }
    for (var i = 0; i < n; i += 1) {
      var frag = detailSubrowTemplate.content.cloneNode(true);
      var sub = frag.querySelector(".detail-subrow");
      if (!sub) {
        continue;
      }
      var nameIn = sub.querySelector(".js-detail-name");
      var profIn = sub.querySelector(".js-detail-profiles");
      var engIn = sub.querySelector(".js-detail-engagement");
      var othIn = sub.querySelector(".js-detail-other");
      var volIn = sub.querySelector(".js-detail-volume");
      if (profIn || engIn || othIn) {
        var classType = "engagement";
        if (prev[i]) {
          if (prev[i].classType) {
            classType = prev[i].classType;
          } else if (prev[i].profiles) {
            classType = "profiles";
          }
        } else {
          var mainOn = row.querySelector(".js-profile-check") && row.querySelector(".js-profile-check").checked;
          classType = mainOn && i === 0 ? "profiles" : "engagement";
        }
        setDetailClassSelection(sub, classType);
      }
      var isProfiles = getDetailClassSelection(sub) === "profiles";
      if (nameIn) {
        if (prev[i] && prev[i].name && String(prev[i].name).trim()) {
          nameIn.value = prev[i].name;
        } else {
          nameIn.value = getDetailNamePreset(row, i, isProfiles);
        }
      }
      if (volIn) {
        var volRestored = false;
        if (prev[i] && prev[i].volume != null && String(prev[i].volume).trim() !== "") {
          var pv = parseLocaleNumber(prev[i].volume);
          if (!isNaN(pv)) {
            volIn.value = formatEnUSNumber(pv);
            volRestored = true;
          }
        }
        if (!volRestored) {
          setVolumeFromRule(volIn, isProfiles);
        }
        (function (subEl, volEl, rowRef, idx, nameEl, profEl, engEl, othEl) {
          function onClassChange(changedEl, nextType) {
            if (changedEl && !changedEl.checked) {
              if (nextType === "profiles" && profEl) {
                profEl.checked = true;
              } else if (nextType === "other" && othEl) {
                othEl.checked = true;
              } else if (engEl) {
                engEl.checked = true;
              }
            } else {
              setDetailClassSelection(subEl, nextType);
            }
            var isProf = getDetailClassSelection(subEl) === "profiles";
            setVolumeFromRule(volEl, isProf);
            if (nameEl) {
              nameEl.value = getDetailNamePreset(rowRef, idx, isProf);
            }
            updateRecordTotalForRow(rowRef);
          }
          if (profEl) {
            profEl.addEventListener("change", function () {
              onClassChange(profEl, "profiles");
            });
          }
          if (engEl) {
            engEl.addEventListener("change", function () {
              onClassChange(engEl, "engagement");
            });
          }
          if (othEl) {
            othEl.addEventListener("change", function () {
              onClassChange(othEl, "other");
            });
          }
        })(sub, volIn, row, i, nameIn, profIn, engIn, othIn);
        volIn.addEventListener("input", function () {
          updateRecordTotalForRow(row);
        });
        attachCommaFormatting(volIn);
      }
      list.appendChild(sub);
      var removeBtn = sub.querySelector(".js-detail-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", function () {
          var listEl = row.querySelector(".js-advanced-detail-list");
          var counterIn = row.querySelector(".js-counter-value");
          sub.remove();
          var remaining = listEl ? listEl.querySelectorAll(".detail-subrow").length : 0;
          if (counterIn) {
            counterIn.value = formatEnUSNumber(remaining);
          }
          if (listEl && remaining === 0) {
            listEl.innerHTML = "";
            var emptyP = document.createElement("p");
            emptyP.className = "detail-list__empty";
            emptyP.textContent =
              "Set “Number of Objects or Streams” above to add detail rows.";
            listEl.appendChild(emptyP);
          }
          updateRecordTotalForRow(row);
        });
      }
    }
    updateRecordTotalForRow(row);
  }

  function isAdvancedExpanded(row) {
    var btn = row.querySelector(".js-source-advanced");
    return btn && btn.getAttribute("aria-expanded") === "true";
  }

  function onCounterMaybeRebuild(row) {
    if (isAdvancedExpanded(row)) {
      rebuildAdvancedDetails(row);
    } else {
      updateRecordTotalForRow(row);
    }
  }

  function refreshDetailVolumesInRow(row) {
    row.querySelectorAll(".detail-subrow").forEach(function (sub) {
      var vol = sub.querySelector(".js-detail-volume");
      if (vol) {
        setVolumeFromRule(vol, getDetailClassSelection(sub) === "profiles");
      }
    });
  }

  function refreshAllOpenDetailVolumes() {
    document.querySelectorAll(".source-row").forEach(refreshDetailVolumesInRow);
    document.querySelectorAll(".source-row").forEach(updateRecordTotalForRow);
  }

  var customerCountInput = document.getElementById("customer-count");
  if (customerCountInput) {
    attachCommaFormatting(customerCountInput);
    customerCountInput.addEventListener("input", function () {
      refreshAllOpenDetailVolumes();
      document.querySelectorAll(".source-row").forEach(updateRecordTotalForRow);
      updateLandscapeSummary();
    });
    customerCountInput.addEventListener("blur", function () {
      updateLandscapeSummary();
    });
  }

  document.querySelectorAll(".js-landscape-bucket-count").forEach(function (inp) {
    attachCommaFormatting(inp);
    inp.addEventListener("input", syncSourceRowsToBucketCounts);
  });
  document.querySelectorAll(".js-landscape-bucket-dec").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var k = btn.getAttribute("data-landscape-bucket");
      if (k) {
        stepBucketCount(k, -1);
      }
    });
  });
  document.querySelectorAll(".js-landscape-bucket-inc").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var k = btn.getAttribute("data-landscape-bucket");
      if (k) {
        stepBucketCount(k, 1);
      }
    });
  });

  function setStepIndicators(step) {
    stepItems.forEach(function (li) {
      var n = parseInt(li.getAttribute("data-wizard-step"), 10);
      li.classList.remove("steps__item--active", "steps__item--complete");
      if (n < step) {
        li.classList.add("steps__item--complete");
      } else if (n === step) {
        li.classList.add("steps__item--active");
      }
    });
  }

  function setVisiblePanel(step) {
    panelSteps.forEach(function (el) {
      var s = parseInt(el.getAttribute("data-panel-step"), 10);
      if (s === step) {
        el.removeAttribute("hidden");
      } else {
        el.setAttribute("hidden", "");
      }
    });
  }

  function updateFooter(step) {
    if (backBtn) {
      if (step > 1) {
        backBtn.removeAttribute("hidden");
      } else {
        backBtn.setAttribute("hidden", "");
      }
    }
    if (nextBtn) {
      nextBtn.textContent = step >= MAX_STEP ? "Finish" : "Next →";
    }
  }

  function bindSourceRow(row) {
    ensureLandscapeSourceId(row);
    var removeBtn = row.querySelector(".js-remove-source");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        if (!sourceList || sourceList.querySelectorAll(".source-row").length === 0) {
          return;
        }
        row.remove();
        syncRemoveButtons();
        updateLandscapeBucketInputsFromDom();
        updateLandscapeSummary();
      });
    }

    var advBtn = row.querySelector(".js-source-advanced");
    var advPanel = row.querySelector(".js-source-advanced-panel");
    if (advBtn && advPanel) {
      sourceRowUid += 1;
      var panelId = "source-advanced-" + sourceRowUid;
      advPanel.id = panelId;
      advBtn.setAttribute("aria-controls", panelId);
      function toggleSourceAdvancedPanel() {
        if (advBtn.disabled) {
          return;
        }
        var expanded = advBtn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          advPanel.setAttribute("hidden", "");
          advBtn.setAttribute("aria-expanded", "false");
          row.classList.remove("source-row--expanded");
        } else {
          advPanel.removeAttribute("hidden");
          advBtn.setAttribute("aria-expanded", "true");
          row.classList.add("source-row--expanded");
          if (needsAdvancedDetailRebuild(row)) {
            rebuildAdvancedDetails(row);
          } else {
            updateRecordTotalForRow(row);
          }
        }
      }
      advBtn.addEventListener("click", toggleSourceAdvancedPanel);
      var recordTotal = row.querySelector(".js-record-total");
      if (recordTotal && (recordTotal.readOnly || recordTotal.hasAttribute("readonly"))) {
        recordTotal.addEventListener("click", function () {
          toggleSourceAdvancedPanel();
        });
      }
    }

    var catSel = row.querySelector(".js-source-category");
    if (catSel) {
      catSel.addEventListener("focus", function () {
        catSel.dataset.prevSourceCatIdx = String(catSel.selectedIndex);
      });
      catSel.addEventListener("change", function () {
        if (row.classList.contains("source-row--segment")) {
          return;
        }
        applySourceTypeBehavior(row);
        row.querySelectorAll(".detail-subrow").forEach(function (sub, idx) {
          var ne = sub.querySelector(".js-detail-name");
          if (ne) {
            ne.value = getDetailNamePreset(row, idx, getDetailClassSelection(sub) === "profiles");
          }
        });
        updateRecordTotalForRow(row);
      });
    }

    var mainProfileChk = row.querySelector(".js-profile-check");
    if (mainProfileChk) {
      mainProfileChk.addEventListener("change", function () {
        var list = row.querySelector(".js-advanced-detail-list");
        if (list && list.querySelector(".detail-subrow")) {
          syncDetailProfilesFromMain(row);
        } else {
          updateRecordTotalForRow(row);
        }
      });
    }

    var dec = row.querySelector(".js-counter-dec");
    var inc = row.querySelector(".js-counter-inc");
    var countInput = row.querySelector(".js-counter-value");
    if (dec && inc && countInput) {
      attachCommaFormatting(countInput);
      dec.addEventListener("click", function () {
        var v = parseLocaleNumber(countInput.value);
        if (isNaN(v)) {
          v = 0;
        }
        countInput.value = formatEnUSNumber(Math.max(0, v - 1));
        onCounterMaybeRebuild(row);
      });
      inc.addEventListener("click", function () {
        var v = parseLocaleNumber(countInput.value);
        if (isNaN(v)) {
          v = 0;
        }
        countInput.value = formatEnUSNumber(v + 1);
        onCounterMaybeRebuild(row);
      });
      countInput.addEventListener("input", function () {
        onCounterMaybeRebuild(row);
      });
    }

    applySourceTypeBehavior(row);
  }

  function syncRemoveButtons() {
    if (!sourceList) {
      return;
    }
    var rows = sourceList.querySelectorAll(".source-row");
    rows.forEach(function (r) {
      var btn = r.querySelector(".js-remove-source");
      if (btn) {
        btn.disabled = false;
        btn.setAttribute("aria-disabled", "false");
      }
    });
  }

  function addSourceRow() {
    stepBucketCount("bulk", 1);
  }

  function ensureDataLandscapeRows() {
    if (dataLandscapeSeeded || !sourceList) {
      return;
    }
    dataLandscapeSeeded = true;
    syncSourceRowsToBucketCounts();
    sourceList.querySelectorAll(".source-row").forEach(function (row) {
      if (row.classList.contains("source-row--segment")) {
        return;
      }
      rebuildAdvancedDetails(row);
    });
    formatNumericFieldsIn(sourceList);
    updateDataSourcesBarCount();
  }

  function goToStep(step) {
    if (step < 1) {
      step = 1;
    }
    if (step > MAX_STEP) {
      step = MAX_STEP;
    }
    currentStep = step;
    setStepIndicators(step);
    setVisiblePanel(step);
    updateFooter(step);
    var systemGenWrap = document.querySelector(".js-system-gen-data-wrap");
    if (systemGenWrap) {
      if (step === 2) {
        systemGenWrap.removeAttribute("hidden");
      } else {
        systemGenWrap.setAttribute("hidden", "");
        var systemGenPanel = document.querySelector(".js-system-gen-details-panel");
        var systemGenToggle = document.querySelector(".js-system-gen-details-toggle");
        if (systemGenPanel && systemGenToggle) {
          systemGenPanel.setAttribute("hidden", "");
          systemGenToggle.setAttribute("aria-expanded", "false");
        }
      }
    }
    var dataSourcesPanel = document.querySelector(".js-data-sources-details-panel");
    var dataSourcesToggle = document.querySelector(".js-data-sources-details-toggle");
    if (step !== 2 && dataSourcesPanel && dataSourcesToggle) {
      dataSourcesPanel.setAttribute("hidden", "");
      dataSourcesToggle.setAttribute("aria-expanded", "false");
    }
    var dataPrepDetailsPanel = document.querySelector(".js-data-prep-details-panel");
    var dataPrepDetailsToggle = document.querySelector(".js-data-prep-details-toggle");
    if (step !== 3 && dataPrepDetailsPanel && dataPrepDetailsToggle) {
      dataPrepDetailsPanel.setAttribute("hidden", "");
      dataPrepDetailsToggle.setAttribute("aria-expanded", "false");
    }
    if (step >= 2) {
      ensureDataLandscapeRows();
    }
    updateSystemGeneratedData();
  }

  function collectIdentityResolutionSnapshot(mainTr, advTr) {
    var pickRoot = advTr.querySelector(".js-landscape-pick");
    var hid = pickRoot && pickRoot.querySelector(".js-landscape-pick-value");
    var freq = mainTr.querySelector(".js-data-prep-frequency");
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var useAll = panel && panel.querySelector(".js-data-prep-identity-use-all-profiles");
    return {
      name: (mainTr.querySelector(".js-data-prep-name") || {}).value || "",
      profiles: (mainTr.querySelector(".js-data-prep-rows") || {}).value || "",
      daily: (mainTr.querySelector(".js-data-prep-daily-change-pct") || {}).value || "",
      freqIdx: freq ? freq.selectedIndex : 0,
      unified: (mainTr.querySelector(".js-data-prep-unified-profile-rows") || {}).value || "",
      pickJson: hid ? hid.value : "",
      expanded: !advTr.hasAttribute("hidden"),
      useAllProfiles: useAll ? !!useAll.checked : true,
    };
  }

  function applyIdentityResolutionSnapshot(mainTr, advTr, snap) {
    var nameEl = mainTr.querySelector(".js-data-prep-name");
    if (nameEl && snap.name != null) {
      nameEl.value = snap.name;
    }
    var profEl = mainTr.querySelector(".js-data-prep-rows");
    if (profEl && snap.profiles != null) {
      profEl.value = snap.profiles;
    }
    var dailyEl = mainTr.querySelector(".js-data-prep-daily-change-pct");
    if (dailyEl && snap.daily != null) {
      dailyEl.value = snap.daily;
    }
    var freqEl = mainTr.querySelector(".js-data-prep-frequency");
    if (freqEl && snap.freqIdx != null && snap.freqIdx >= 0 && snap.freqIdx < freqEl.options.length) {
      freqEl.selectedIndex = snap.freqIdx;
    }
    var uniEl = mainTr.querySelector(".js-data-prep-unified-profile-rows");
    if (uniEl && snap.unified != null) {
      uniEl.value = snap.unified;
    }
    var pickRoot = advTr.querySelector(".js-landscape-pick");
    var hid = pickRoot && pickRoot.querySelector(".js-landscape-pick-value");
    if (hid && snap.pickJson != null && String(snap.pickJson).trim()) {
      hid.value = snap.pickJson;
    }
    if (pickRoot && typeof pickRoot._landscapePickRefresh === "function") {
      pickRoot._landscapePickRefresh();
    }
    var idPanel = advTr.querySelector(".js-data-prep-advanced-panel");
    var useAllCb = idPanel && idPanel.querySelector(".js-data-prep-identity-use-all-profiles");
    var usePickCb = idPanel && idPanel.querySelector(".js-data-prep-identity-use-pick");
    if (useAllCb && usePickCb) {
      if (snap.useAllProfiles === undefined) {
        var hidMode = idPanel.querySelector(".js-landscape-pick-value");
        var idsMode = readPickIdsFromHidden(hidMode);
        if (idsMode.length > 0) {
          usePickCb.checked = true;
          useAllCb.checked = false;
        } else {
          useAllCb.checked = true;
          usePickCb.checked = false;
        }
      } else {
        useAllCb.checked = !!snap.useAllProfiles;
        usePickCb.checked = !snap.useAllProfiles;
      }
      updateIdentitySizingColumnsVisual(idPanel);
      syncIdentityProfilesProcessedFromMode(mainTr, advTr);
    }
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    if (snap.expanded === false) {
      advTr.setAttribute("hidden", "");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "false");
      }
      mainTr.classList.remove("data-prep-item--expanded");
    } else {
      advTr.removeAttribute("hidden");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "true");
      }
      mainTr.classList.add("data-prep-item--expanded");
    }
  }

  function insertIdentityPairAfter(prevAdvTr, snapshot) {
    var tbody = prevAdvTr.parentNode;
    var template = document.getElementById("data-prep-item-template-identity");
    if (!template || !tbody || !tbody.classList.contains("js-data-prep-tbody-identity")) {
      return;
    }
    var frag = template.content.cloneNode(true);
    var mainTr = frag.querySelector(".data-prep-item__main");
    var advTr = frag.querySelector(".data-prep-item__advanced");
    if (!mainTr || !advTr) {
      return;
    }
    var pickHidden = advTr.querySelector(".js-landscape-pick-value");
    if (pickHidden && snapshot) {
      var pj = snapshot.pickJson;
      if (String(pj || "").trim()) {
        pickHidden.value = pj;
      } else {
        pickHidden.value = JSON.stringify({ picks: [] });
      }
    }
    var ref = prevAdvTr.nextSibling;
    tbody.insertBefore(mainTr, ref);
    tbody.insertBefore(advTr, mainTr.nextSibling);
    bindDataPrepItemRow(mainTr, advTr);
    applyIdentityResolutionSnapshot(mainTr, advTr, snapshot);
    formatNumericFieldsIn(tbody);
    updateLandscapeSummary();
  }

  function cloneIdentityResolutionRow(mainTr, advTr) {
    var snap = collectIdentityResolutionSnapshot(mainTr, advTr);
    var base = String(snap.name || "").trim();
    snap.name = (base ? base : "Identity Resolution 1") + " (2)";
    insertIdentityPairAfter(advTr, snap);
  }

  function syncTransformNewObjectRowsEditable(mainTr) {
    if (!mainTr || !mainTr.closest(".js-data-prep-tbody-transforms")) {
      return;
    }
    var chk = mainTr.querySelector(".js-data-prep-output-new-object");
    var nov = mainTr.querySelector(".js-data-prep-new-object-rows");
    if (!nov) {
      return;
    }
    if (chk && chk.checked) {
      nov.readOnly = false;
      nov.removeAttribute("aria-disabled");
      nov.setAttribute("aria-label", "New object rows");
      attachCommaFormatting(nov);
    } else {
      nov.readOnly = true;
      nov.setAttribute("aria-disabled", "true");
      nov.setAttribute("aria-label", "New object rows (enable Output as new object to edit)");
      nov.value = formatEnUSNumber(0);
    }
  }

  function collectDualSizingSnapshot(advTr) {
    var advPanel = advTr.querySelector(".js-data-prep-advanced-panel");
    var usePctChk = advPanel && advPanel.querySelector(".js-data-prep-transform-use-percent");
    var pctElSnap = advPanel && advPanel.querySelector(".js-data-prep-transform-pct-of-landscape");
    return {
      rowsMode: usePctChk && usePctChk.checked ? "percent" : "pick",
      pctLandscape: pctElSnap ? String(pctElSnap.value || "") : "",
    };
  }

  function applyDualSizingFromSnapshot(mainTr, advTr, snap) {
    var advPanel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!advPanel) {
      return;
    }
    var usePctChk = advPanel.querySelector(".js-data-prep-transform-use-percent");
    var usePickChk = advPanel.querySelector(".js-data-prep-transform-use-pick");
    if (!usePctChk || !usePickChk) {
      return;
    }
    if (snap.rowsMode === "pick") {
      usePickChk.checked = true;
      usePctChk.checked = false;
    } else {
      usePctChk.checked = true;
      usePickChk.checked = false;
    }
    var pctEl0 = advPanel.querySelector(".js-data-prep-transform-pct-of-landscape");
    if (pctEl0 && snap.pctLandscape != null) {
      pctEl0.value = snap.pctLandscape;
    }
    updateTransformSizingColumnsVisual(advPanel);
    syncTransformRowsForCurrentMode(mainTr, advTr);
  }

  function collectTransformSnapshot(mainTr, advTr) {
    var pickRoot = advTr.querySelector(".js-landscape-pick");
    var hid = pickRoot && pickRoot.querySelector(".js-landscape-pick-value");
    var freq = mainTr.querySelector(".js-data-prep-frequency");
    var newObj = mainTr.querySelector(".js-data-prep-output-new-object");
    var nov = mainTr.querySelector(".js-data-prep-new-object-rows");
    var dual = collectDualSizingSnapshot(advTr);
    return {
      name: (mainTr.querySelector(".js-data-prep-name") || {}).value || "",
      rows: (mainTr.querySelector(".js-data-prep-rows") || {}).value || "",
      freqIdx: freq ? freq.selectedIndex : 0,
      newObject: !!(newObj && newObj.checked),
      newObjectRows: (nov || {}).value || "",
      pickJson: hid ? hid.value : "",
      expanded: !advTr.hasAttribute("hidden"),
      rowsMode: dual.rowsMode,
      pctLandscape: dual.pctLandscape,
    };
  }

  function applyTransformSnapshot(mainTr, advTr, snap) {
    var nameEl = mainTr.querySelector(".js-data-prep-name");
    if (nameEl && snap.name != null) {
      nameEl.value = snap.name;
    }
    var profEl = mainTr.querySelector(".js-data-prep-rows");
    if (profEl && snap.rows != null) {
      profEl.value = snap.rows;
    }
    var freqEl = mainTr.querySelector(".js-data-prep-frequency");
    if (freqEl && snap.freqIdx != null && snap.freqIdx >= 0 && snap.freqIdx < freqEl.options.length) {
      freqEl.selectedIndex = snap.freqIdx;
    }
    var newObj = mainTr.querySelector(".js-data-prep-output-new-object");
    var nov = mainTr.querySelector(".js-data-prep-new-object-rows");
    if (newObj) {
      newObj.checked = !!snap.newObject;
    }
    if (nov) {
      if (newObj && newObj.checked) {
        if (snap.newObjectRows != null && String(snap.newObjectRows).trim() !== "") {
          nov.value = snap.newObjectRows;
        } else {
          nov.value = formatEnUSNumber(0);
        }
      } else {
        nov.value = formatEnUSNumber(0);
      }
    }
    var pickRoot = advTr.querySelector(".js-landscape-pick");
    var hid = pickRoot && pickRoot.querySelector(".js-landscape-pick-value");
    if (hid && snap.pickJson != null && String(snap.pickJson).trim()) {
      hid.value = snap.pickJson;
    }
    if (pickRoot && typeof pickRoot._landscapePickRefresh === "function") {
      pickRoot._landscapePickRefresh();
    }
    applyDualSizingFromSnapshot(mainTr, advTr, snap);
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    if (snap.expanded === false) {
      advTr.setAttribute("hidden", "");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "false");
      }
      mainTr.classList.remove("data-prep-item--expanded");
    } else {
      advTr.removeAttribute("hidden");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "true");
      }
      mainTr.classList.add("data-prep-item--expanded");
    }
    if (mainTr.closest(".js-data-prep-tbody-transforms")) {
      syncTransformNewObjectRowsEditable(mainTr);
    }
  }

  function insertTransformPairAfter(prevAdvTr, snapshot) {
    var tbody = prevAdvTr.parentNode;
    var template = document.getElementById("data-prep-item-template-transforms");
    if (!template || !tbody || !tbody.classList.contains("js-data-prep-tbody-transforms")) {
      return;
    }
    var frag = template.content.cloneNode(true);
    var mainTr = frag.querySelector(".data-prep-item__main");
    var advTr = frag.querySelector(".data-prep-item__advanced");
    if (!mainTr || !advTr) {
      return;
    }
    var pickHidden = advTr.querySelector(".js-landscape-pick-value");
    if (pickHidden && snapshot) {
      var pj = snapshot.pickJson;
      if (String(pj || "").trim()) {
        pickHidden.value = pj;
      } else {
        pickHidden.value = JSON.stringify({ picks: [] });
      }
    }
    var ref = prevAdvTr.nextSibling;
    tbody.insertBefore(mainTr, ref);
    tbody.insertBefore(advTr, mainTr.nextSibling);
    bindDataPrepItemRow(mainTr, advTr);
    applyTransformSnapshot(mainTr, advTr, snapshot);
    formatNumericFieldsIn(tbody);
    updateSystemGeneratedData();
  }

  function cloneTransformRow(mainTr, advTr) {
    var snap = collectTransformSnapshot(mainTr, advTr);
    var base = String(snap.name || "").trim();
    snap.name = (base ? base : "Transform") + " (2)";
    insertTransformPairAfter(advTr, snap);
  }

  function collectInsightSnapshot(mainTr, advTr) {
    var pickRoot = advTr.querySelector(".js-landscape-pick");
    var hid = pickRoot && pickRoot.querySelector(".js-landscape-pick-value");
    var freq = mainTr.querySelector(".js-data-prep-frequency");
    var aggSel = mainTr.querySelector(".js-data-prep-insight-aggregate-object");
    var nir = mainTr.querySelector(".js-data-prep-insight-new-rows");
    var dual = collectDualSizingSnapshot(advTr);
    return {
      name: (mainTr.querySelector(".js-data-prep-name") || {}).value || "",
      rows: (mainTr.querySelector(".js-data-prep-rows") || {}).value || "",
      freqIdx: freq ? freq.selectedIndex : 0,
      aggregateIdx: aggSel ? aggSel.selectedIndex : 0,
      newInsightRows: nir ? String(nir.value || "") : "",
      pickJson: hid ? hid.value : "",
      expanded: !advTr.hasAttribute("hidden"),
      rowsMode: dual.rowsMode,
      pctLandscape: dual.pctLandscape,
    };
  }

  function applyInsightSnapshot(mainTr, advTr, snap) {
    var nameEl = mainTr.querySelector(".js-data-prep-name");
    if (nameEl && snap.name != null) {
      nameEl.value = snap.name;
    }
    var profEl = mainTr.querySelector(".js-data-prep-rows");
    if (profEl && snap.rows != null) {
      profEl.value = snap.rows;
    }
    var freqEl = mainTr.querySelector(".js-data-prep-frequency");
    if (freqEl && snap.freqIdx != null && snap.freqIdx >= 0 && snap.freqIdx < freqEl.options.length) {
      freqEl.selectedIndex = snap.freqIdx;
    }
    var aggEl = mainTr.querySelector(".js-data-prep-insight-aggregate-object");
    if (aggEl && snap.aggregateIdx != null && snap.aggregateIdx >= 0 && snap.aggregateIdx < aggEl.options.length) {
      aggEl.selectedIndex = snap.aggregateIdx;
    }
    var nirEl = mainTr.querySelector(".js-data-prep-insight-new-rows");
    if (nirEl && aggEl && snap.aggregateIdx === 2 && snap.newInsightRows != null) {
      nirEl.value = snap.newInsightRows;
    }
    var pickRoot = advTr.querySelector(".js-landscape-pick");
    var hid = pickRoot && pickRoot.querySelector(".js-landscape-pick-value");
    if (hid && snap.pickJson != null && String(snap.pickJson).trim()) {
      hid.value = snap.pickJson;
    }
    if (pickRoot && typeof pickRoot._landscapePickRefresh === "function") {
      pickRoot._landscapePickRefresh();
    }
    applyDualSizingFromSnapshot(mainTr, advTr, snap);
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    if (snap.expanded === false) {
      advTr.setAttribute("hidden", "");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "false");
      }
      mainTr.classList.remove("data-prep-item--expanded");
    } else {
      advTr.removeAttribute("hidden");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "true");
      }
      mainTr.classList.add("data-prep-item--expanded");
    }
    syncInsightNewRowsField(mainTr);
  }

  function insertInsightPairAfter(prevAdvTr, snapshot) {
    var tbody = prevAdvTr.parentNode;
    var template = document.getElementById("data-prep-item-template");
    if (
      !template ||
      !tbody ||
      (!tbody.classList.contains("js-data-prep-tbody-insights") &&
        !tbody.classList.contains("js-data-prep-tbody-data-graphs"))
    ) {
      return;
    }
    var frag = template.content.cloneNode(true);
    var mainTr = frag.querySelector(".data-prep-item__main");
    var advTr = frag.querySelector(".data-prep-item__advanced");
    if (!mainTr || !advTr) {
      return;
    }
    var pickHidden = advTr.querySelector(".js-landscape-pick-value");
    if (pickHidden && snapshot) {
      var pj = snapshot.pickJson;
      if (String(pj || "").trim()) {
        pickHidden.value = pj;
      } else {
        pickHidden.value = JSON.stringify({ picks: [] });
      }
    }
    var ref = prevAdvTr.nextSibling;
    tbody.insertBefore(mainTr, ref);
    tbody.insertBefore(advTr, mainTr.nextSibling);
    bindDataPrepItemRow(mainTr, advTr);
    applyInsightSnapshot(mainTr, advTr, snapshot);
    formatNumericFieldsIn(tbody);
    updateSystemGeneratedData();
  }

  function cloneInsightRow(mainTr, advTr) {
    var snap = collectInsightSnapshot(mainTr, advTr);
    var base = String(snap.name || "").trim();
    var def = mainTr.closest(".js-data-prep-tbody-data-graphs") ? "Data Graph 1" : "Calculated Insights 1";
    snap.name = (base ? base : def) + " (2)";
    insertInsightPairAfter(advTr, snap);
  }

  function deleteDataPrepRowPair(mainTr, advTr) {
    advTr.remove();
    mainTr.remove();
    updateLandscapeSummary();
  }

  function bindDataPrepItemRow(mainTr, advTr) {
    var btn = mainTr.querySelector(".js-data-prep-edit");
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    if (!btn || !panel || !advTr) {
      return;
    }
    dataPrepItemUid += 1;
    panel.id = "data-prep-adv-" + dataPrepItemUid;
    btn.setAttribute("aria-controls", panel.id);
    advTr.setAttribute("hidden", "");
    btn.setAttribute("aria-expanded", "false");
    mainTr.classList.remove("data-prep-item--expanded");
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    if (rowsIn) {
      attachCommaFormatting(rowsIn);
    }
    var unifiedRowsIn = mainTr.querySelector(".js-data-prep-unified-profile-rows");
    if (unifiedRowsIn) {
      attachCommaFormatting(unifiedRowsIn);
    }
    var pickRoot = panel.querySelector(".js-landscape-pick");
    if (pickRoot) {
      initLandscapePick(pickRoot);
    }
    if (mainTr.closest(".js-data-prep-tbody-identity")) {
      bindIdentityProfilesInputSource(mainTr, advTr);
    }
    if (mainTr.closest(".js-data-prep-tbody-transforms") || mainTrIsInsightStyle(mainTr)) {
      bindDataPrepDualSizingAdvanced(mainTr, advTr);
    }
    if (mainTrIsInsightStyle(mainTr)) {
      syncInsightNewRowsField(mainTr);
    }
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      if (expanded) {
        advTr.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
        mainTr.classList.remove("data-prep-item--expanded");
      } else {
        advTr.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
        mainTr.classList.add("data-prep-item--expanded");
      }
    });

    if (rowsIn) {
      function expandDataPrepAdvancedIfCollapsed() {
        if (advTr.hasAttribute("hidden")) {
          advTr.removeAttribute("hidden");
          btn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      }
      rowsIn.addEventListener("focusin", expandDataPrepAdvancedIfCollapsed);
      rowsIn.addEventListener("click", expandDataPrepAdvancedIfCollapsed);
    }

    if (unifiedRowsIn) {
      function expandDataPrepAdvancedIfCollapsedUnified() {
        if (advTr.hasAttribute("hidden")) {
          advTr.removeAttribute("hidden");
          btn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      }
      unifiedRowsIn.addEventListener("focusin", expandDataPrepAdvancedIfCollapsedUnified);
      unifiedRowsIn.addEventListener("click", expandDataPrepAdvancedIfCollapsedUnified);
    }

    var cloneBtn = mainTr.querySelector(".js-data-prep-clone");
    if (cloneBtn) {
      cloneBtn.addEventListener("click", function () {
        if (mainTr.closest(".js-data-prep-tbody-identity")) {
          cloneIdentityResolutionRow(mainTr, advTr);
        } else if (mainTr.closest(".js-data-prep-tbody-transforms")) {
          cloneTransformRow(mainTr, advTr);
        } else if (mainTrIsInsightStyle(mainTr)) {
          cloneInsightRow(mainTr, advTr);
        }
      });
    }
    var deleteBtn = mainTr.querySelector(".js-data-prep-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        deleteDataPrepRowPair(mainTr, advTr);
      });
    }

    var newObjChk = mainTr.querySelector(".js-data-prep-output-new-object");
    var novRows = mainTr.querySelector(".js-data-prep-new-object-rows");
    if (newObjChk && novRows && mainTr.closest(".js-data-prep-tbody-transforms")) {
      newObjChk.addEventListener("change", function () {
        syncTransformNewObjectRowsEditable(mainTr);
        updateSystemGeneratedData();
      });
      syncTransformNewObjectRowsEditable(mainTr);
    }
  }

  function addDataPrepItemRow(tbody) {
    var templateId = "data-prep-item-template";
    if (tbody && tbody.classList.contains("js-data-prep-tbody-transforms")) {
      templateId = "data-prep-item-template-transforms";
    } else if (tbody && tbody.classList.contains("js-data-prep-tbody-identity")) {
      templateId = "data-prep-item-template-identity";
    }
    var template = document.getElementById(templateId);
    if (!template || !tbody) {
      return;
    }
    var frag = template.content.cloneNode(true);
    var mainTr = frag.querySelector(".data-prep-item__main");
    var advTr = frag.querySelector(".data-prep-item__advanced");
    if (!mainTr || !advTr) {
      return;
    }
    tbody.appendChild(mainTr);
    tbody.appendChild(advTr);
    if (tbody.classList.contains("js-data-prep-tbody-identity")) {
      var idNameEarly = mainTr.querySelector(".js-data-prep-name");
      if (idNameEarly && !String(idNameEarly.value || "").trim()) {
        idNameEarly.value = "Identity Resolution " + tbody.querySelectorAll(".data-prep-item__main").length;
      }
    }
    if (tbody.classList.contains("js-data-prep-tbody-transforms")) {
      var tfName = mainTr.querySelector(".js-data-prep-name");
      if (tfName && !String(tfName.value || "").trim()) {
        tfName.value = "Data Transforms " + tbody.querySelectorAll(".data-prep-item__main").length;
      }
    }
    if (tbody.classList.contains("js-data-prep-tbody-data-graphs")) {
      var dgName = mainTr.querySelector(".js-data-prep-name");
      if (dgName && !String(dgName.value || "").trim()) {
        dgName.value = "Data Graph " + tbody.querySelectorAll(".data-prep-item__main").length;
      }
    }
    if (tbody.classList.contains("js-data-prep-tbody-insights")) {
      var ciName = mainTr.querySelector(".js-data-prep-name");
      if (ciName && !String(ciName.value || "").trim()) {
        ciName.value = "Calculated Insights " + tbody.querySelectorAll(".data-prep-item__main").length;
      }
    }
    bindDataPrepItemRow(mainTr, advTr);
    if (tbody.classList.contains("js-data-prep-tbody-identity")) {
      var unifiedExpected = mainTr.querySelector(".js-data-prep-unified-profile-rows");
      if (unifiedExpected) {
        unifiedExpected.value = formatEnUSNumber(getCustomerCount());
      }
      var dailyPct = mainTr.querySelector(".js-data-prep-daily-change-pct");
      if (dailyPct && !String(dailyPct.value || "").trim()) {
        dailyPct.value = "2%";
      }
    }
    formatNumericFieldsIn(tbody);
    updateLandscapeSummary();
  }

  function refreshDataPrepSectionTableVisibility() {
    document.querySelectorAll(".data-prep-section").forEach(function (section) {
      var tbody = section.querySelector("tbody");
      var tableWrap = section.querySelector(".data-prep-table-scroll");
      if (!tbody || !tableWrap) {
        return;
      }
      var hasRows = tbody.querySelectorAll("tr.data-prep-item__main").length > 0;
      if (hasRows) {
        tableWrap.removeAttribute("hidden");
      } else {
        tableWrap.setAttribute("hidden", "");
      }
    });
  }

  function getDataPrepQuestionCountInput(kind) {
    return document.querySelector('.js-data-prep-count-input[data-prep-kind="' + kind + '"]');
  }

  function getDataPrepQuestionFollowup(kind) {
    return document.querySelector('.js-data-prep-followup[data-prep-kind="' + kind + '"]');
  }

  function getDataPrepQuestionYesNoButtons(kind) {
    return document.querySelectorAll('.js-data-prep-yesno[data-prep-kind="' + kind + '"]');
  }

  function dataPrepYesIsSelected(kind) {
    var yesBtn = document.querySelector(
      '.js-data-prep-yesno[data-prep-kind="' + kind + '"][data-prep-value="yes"]'
    );
    return !!(yesBtn && yesBtn.getAttribute("aria-pressed") === "true");
  }

  function setDataPrepQuestionState(kind, yesSelected, count) {
    var yesNo = getDataPrepQuestionYesNoButtons(kind);
    yesNo.forEach(function (btn) {
      var yes = btn.getAttribute("data-prep-value") === "yes";
      var active = yes ? yesSelected : !yesSelected;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var followup = getDataPrepQuestionFollowup(kind);
    if (followup) {
      if (yesSelected) {
        followup.removeAttribute("hidden");
      } else {
        followup.setAttribute("hidden", "");
      }
    }
    var countInput = getDataPrepQuestionCountInput(kind);
    if (countInput) {
      countInput.value = formatEnUSNumber(Math.max(0, Math.floor(count || 0)));
    }
  }

  function getDataPrepMainRowsCount(tbody) {
    return tbody ? tbody.querySelectorAll("tr.data-prep-item__main").length : 0;
  }

  function removeLastDataPrepPair(tbody) {
    if (!tbody) {
      return;
    }
    var mains = tbody.querySelectorAll("tr.data-prep-item__main");
    if (!mains.length) {
      return;
    }
    var lastMain = mains[mains.length - 1];
    var adv = lastMain.nextElementSibling;
    if (adv && adv.classList.contains("data-prep-item__advanced")) {
      adv.remove();
    }
    lastMain.remove();
  }

  function syncDataPrepQuestionsFromDom() {
    if (syncingDataPrepQuestionRows) {
      return;
    }
    DATA_PREP_QUESTION_DEFS.forEach(function (def) {
      var tbody = document.querySelector(".js-data-prep-tbody-" + def.kind);
      var n = getDataPrepMainRowsCount(tbody);
      var yesSelected = dataPrepYesIsSelected(def.kind);
      setDataPrepQuestionState(def.kind, yesSelected, n);
    });
  }

  function syncDataPrepRowsToQuestionCounts() {
    if (syncingDataPrepQuestionRows) {
      return;
    }
    syncingDataPrepQuestionRows = true;
    DATA_PREP_QUESTION_DEFS.forEach(function (def) {
      var tbody = document.querySelector(".js-data-prep-tbody-" + def.kind);
      if (!tbody) {
        return;
      }
      var yesBtn = document.querySelector(
        '.js-data-prep-yesno[data-prep-kind="' + def.kind + '"][data-prep-value="yes"]'
      );
      var enabled = !!(yesBtn && yesBtn.getAttribute("aria-pressed") === "true");
      var target = 0;
      if (enabled) {
        var countInput = getDataPrepQuestionCountInput(def.kind);
        var raw = parseLocaleNumber(countInput && countInput.value);
        if (isNaN(raw)) {
          raw = getDataPrepMainRowsCount(tbody);
        }
        target = Math.max(0, Math.min(100, Math.floor(raw)));
      }
      var current = getDataPrepMainRowsCount(tbody);
      while (current < target) {
        addDataPrepItemRow(tbody);
        current += 1;
      }
      while (current > target) {
        removeLastDataPrepPair(tbody);
        current -= 1;
      }
      setDataPrepQuestionState(def.kind, enabled, target);
    });
    syncingDataPrepQuestionRows = false;
    updateLandscapeSummary();
  }

  function setDataPrepYesNo(kind, enabled) {
    var tbody = document.querySelector(".js-data-prep-tbody-" + kind);
    var existingRows = tbody ? getDataPrepMainRowsCount(tbody) : 0;
    var countInput = getDataPrepQuestionCountInput(kind);
    var count = 0;
    if (enabled) {
      var raw = parseLocaleNumber(countInput && countInput.value);
      var fromInput = isNaN(raw) ? 0 : Math.floor(raw);
      count = Math.max(1, Math.max(fromInput, existingRows));
    }
    setDataPrepQuestionState(kind, enabled, count);
    syncDataPrepRowsToQuestionCounts();
  }

  function stepDataPrepQuestionCount(kind, delta) {
    if (!dataPrepYesIsSelected(kind)) {
      return;
    }
    var countInput = getDataPrepQuestionCountInput(kind);
    if (!countInput) {
      return;
    }
    var raw = parseLocaleNumber(countInput.value);
    if (isNaN(raw)) {
      raw = 0;
    }
    var n = Math.max(0, Math.min(100, Math.floor(raw) + delta));
    setDataPrepQuestionState(kind, true, n);
    syncDataPrepRowsToQuestionCounts();
  }

  function initDataPrepQuestionControls() {
    document.querySelectorAll(".js-data-prep-yesno").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-prep-kind");
        var yes = btn.getAttribute("data-prep-value") === "yes";
        if (kind) {
          setDataPrepYesNo(kind, yes);
        }
      });
    });
    document.querySelectorAll(".js-data-prep-count-dec").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-prep-kind");
        if (kind) {
          stepDataPrepQuestionCount(kind, -1);
        }
      });
    });
    document.querySelectorAll(".js-data-prep-count-inc").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-prep-kind");
        if (kind) {
          stepDataPrepQuestionCount(kind, 1);
        }
      });
    });
    document.querySelectorAll(".js-data-prep-count-input").forEach(function (input) {
      attachCommaFormatting(input);
      input.addEventListener("input", function () {
        var kind = input.getAttribute("data-prep-kind");
        if (!kind || !dataPrepYesIsSelected(kind)) {
          return;
        }
        var raw = parseLocaleNumber(input.value);
        if (isNaN(raw)) {
          raw = 0;
        }
        var n = Math.max(0, Math.min(100, Math.floor(raw)));
        setDataPrepQuestionState(kind, true, n);
        syncDataPrepRowsToQuestionCounts();
      });
    });
    syncDataPrepQuestionsFromDom();
  }

  function initDataPrep() {
    initDataPrepQuestionControls();
    document.querySelectorAll(".js-data-prep-add").forEach(function (btn) {
      var kind = btn.getAttribute("data-prep-add");
      if (!kind) {
        return;
      }
      var tbody = document.querySelector(".js-data-prep-tbody-" + kind);
      if (!tbody) {
        return;
      }
      btn.addEventListener("click", function () {
        addDataPrepItemRow(tbody);
        syncDataPrepQuestionsFromDom();
        refreshDataPrepSectionTableVisibility();
      });

      var obs = new MutationObserver(function () {
        refreshDataPrepSectionTableVisibility();
      });
      obs.observe(tbody, { childList: true });
    });
    refreshDataPrepSectionTableVisibility();
  }

  var SOLUTION_TEMPLATES = [
    {
      id: "automate-workflows-teams",
      name: "Automate Workflows for My Teams",
      description:
        "Trigger and enrich your process automation workflows in real-time based on unified data changes to eliminate manual tasks and accelerate cross-functional business processes at scale.",
      flexPerYear: 168000,
      questions: [
        "How many distinct business processes or teams do you intend to automate in the first year?",
        "Roughly how many workflow-triggering events or data changes do you expect per day across those processes?",
        "Which source systems must publish events or updates that your automations must react to in near real time?",
        "What service-level expectations (for example maximum delay from data change to action) apply to your highest-priority workflows?",
        "Describe manual steps today that this automation should replace, and any approval or audit requirements.",
      ],
    },
    {
      id: "real-time-web-experiences",
      name: "Real-Time Web Experiences",
      description:
        "Deliver instant web personalization by adapting content based on real-time behavior. Enhance engagement and conversion rates with seamless, consistent experiences across every customer session.",
      flexPerYear: 152000,
      questions: [
        "How many public web properties or apps will consume real-time personalization in scope?",
        "What is your typical concurrent session volume during peak campaigns or launches?",
        "Which signals (behavior, identity, context) must drive personalization for your highest-value journeys?",
        "How often do content or offer catalogs change, and who owns those updates?",
        "What metrics will you use to judge success (for example lift in conversion, engagement time, or return visits)?",
      ],
    },
    {
      id: "segment-target-audiences",
      name: "Segment & Target Audiences",
      description:
        "With Data 360, marketers can build dynamic, high-value segments using unified customer data and AI-powered insights to deliver more personalized, cross-channel engagement.",
      flexPerYear: 175000,
      questionFields: [
        {
          text: "How many Segments will you have?",
          type: "counter",
          defaultValue: 0,
        },
        {
          text: "When publishing Segments, how many include related data?",
          type: "counter",
          defaultValue: 0,
        },
        {
          text: "How frequently will your average segment publish?",
          type: "select",
          options: ["Daily", "Hourly"],
          defaultValue: "Daily",
        },
      ],
      questions: [
        "How many reusable audience segments do you expect to maintain concurrently?",
        "How many outbound channels (email, SMS, ads, in-app, etc.) must receive the same segment definitions?",
        "What volume of customers or prospects falls into your largest recurring campaigns?",
        "How often must segments refresh (batch daily, hourly, or in near real time) for your primary use cases?",
        "Describe how AI or propensity scoring should influence who enters a segment versus rule-only logic.",
      ],
    },
    {
      id: "unified-view-customer",
      name: "Surface a Unified View of my Customer",
      description:
        "Unify fragmented data into a single, real-time customer profile. Empower your teams with a 360-degree view to deliver personalized engagement and consistent experiences across every touchpoint.",
      flexPerYear: 192000,
      questions: [
        "Which customer-facing teams (sales, service, marketing, partners) need the unified view first?",
        "How many source systems contribute attributes or events to a single customer profile today?",
        "What latency is acceptable from a new interaction appearing in a source to it being visible in the unified view?",
        "What identifiers must be reconciled across systems (for example account ID, email, loyalty number)?",
        "List the top five attributes or timelines your teams need on one screen to personalize the next best action.",
      ],
    },
    {
      id: "unified-reporting-analytics",
      name: "Unified Reporting & Analytics",
      description:
        "Transform fragmented data into a single source of truth and empower every user to turn trusted data into actionable insights and accurate reports across your entire ecosystem.",
      flexPerYear: 138000,
      questions: [
        "How many distinct reporting or BI tools do you aim to consolidate or federate against one governed semantic layer?",
        "How many named users need self-service exploration versus scheduled dashboards only?",
        "What is the approximate size of your primary fact tables or event stores that reports must query?",
        "Which regulatory or internal controls require row-level security, lineage, or audit trails for analytics?",
        "Describe the top executive or operational KPIs that must reconcile across departments once reporting is unified.",
      ],
    },
    {
      id: "create-your-own",
      name: "Create Your Own Solution",
      description:
        "Build your own Solution from scratch by assembling a custom set of capabilities, configured to meet whatever use case you have in mind.",
      flexPerYear: null,
      isCreateYourOwn: true,
      questions: [],
    },
  ];
  var SOLUTION_DETAIL_CAPABILITIES = [
    "Data Queries",
    "Segmentation & Activation",
    "Streaming Actions",
    "Streaming Calculated Insights",
    "Streaming Data Transforms",
    "Sub-second Real-Time Events & Entities",
    "Zero Copy Sharing Rows Accessed",
  ];

  var solutionCardUid = 0;

  function closeSolutionTemplateMenu() {
    var picker = document.querySelector(".js-solution-template-picker");
    if (!picker) {
      return;
    }
    picker.classList.remove("solution-template-picker--open");
    var menu = picker.querySelector(".js-solution-template-menu");
    var toggle = picker.querySelector(".js-solution-template-toggle");
    if (menu) {
      menu.hidden = true;
    }
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  function renderSolutionTemplateMenu(menuEl) {
    if (!menuEl) {
      return;
    }
    menuEl.textContent = "";
    SOLUTION_TEMPLATES.forEach(function (tpl) {
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "solution-template-picker__option";
      if (tpl.isCreateYourOwn) {
        opt.classList.add("solution-template-picker__option--custom");
      }
      opt.setAttribute("role", "option");
      opt.setAttribute("data-template-id", tpl.id);
      opt.setAttribute(
        "aria-label",
        tpl.isCreateYourOwn
          ? tpl.name + ". " + tpl.description
          : tpl.name + ". " + tpl.description + " " + formatEnUSNumber(tpl.flexPerYear) + " Flex Credits per year."
      );
      var title = document.createElement("span");
      title.className = "solution-template-picker__option-title";
      title.textContent = tpl.name;
      var meta = document.createElement("span");
      meta.className = "solution-template-picker__option-meta";
      if (tpl.isCreateYourOwn) {
        meta.textContent = "Credits scale with the capabilities you add";
      } else {
        meta.textContent = formatEnUSNumber(tpl.flexPerYear) + " Flex Credits / yr";
      }
      var desc = document.createElement("span");
      desc.className = "solution-template-picker__option-desc";
      desc.textContent = tpl.description;
      opt.appendChild(title);
      opt.appendChild(meta);
      opt.appendChild(desc);
      opt.addEventListener("click", function () {
        addSolutionFromTemplate(tpl.id);
        closeSolutionTemplateMenu();
      });
      menuEl.appendChild(opt);
    });
  }

  function appendSolutionCapabilityRow(tbody, uid, capabilityLabel) {
    if (!tbody) {
      return;
    }
    var idx = tbody.querySelectorAll("tr").length;
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    var inp1 = document.createElement("input");
    inp1.type = "text";
    inp1.className = "input input--block";
    inp1.placeholder = "e.g. " + (capabilityLabel || "Capability");
    inp1.value = (capabilityLabel || "Capability") + " " + (idx + 1);
    inp1.setAttribute("autocomplete", "off");
    inp1.setAttribute("aria-label", "Capability " + (idx + 1));
    td1.appendChild(inp1);
    var td2 = document.createElement("td");
    var inp2 = document.createElement("input");
    inp2.type = "text";
    inp2.setAttribute("inputmode", "numeric");
    inp2.className = "input input--block js-formatted-number";
    inp2.value = "0";
    inp2.setAttribute("autocomplete", "off");
    inp2.setAttribute("aria-label", "Estimated annual volume for capability " + (idx + 1));
    td2.appendChild(inp2);
    var td3 = document.createElement("td");
    var inp3 = document.createElement("input");
    inp3.type = "text";
    inp3.className = "input input--block";
    inp3.placeholder = "Optional";
    inp3.setAttribute("autocomplete", "off");
    inp3.setAttribute("aria-label", "Notes for capability " + (idx + 1));
    td3.appendChild(inp3);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);
    formatNumericFieldsIn(tr);
  }

  function refreshSolutionCapabilitySectionVisibility(root) {
    if (!root) {
      return;
    }
    root.querySelectorAll(".solution-capability-section").forEach(function (section) {
      var tbody = section.querySelector("tbody");
      var tableWrap = section.querySelector(".data-prep-table-scroll");
      if (!tbody || !tableWrap) {
        return;
      }
      var mainRows = tbody.querySelectorAll("tr.data-prep-item__main").length;
      var hasRows = mainRows > 0 || (mainRows === 0 && tbody.querySelectorAll("tr").length > 0);
      if (hasRows) {
        tableWrap.removeAttribute("hidden");
      } else {
        tableWrap.setAttribute("hidden", "");
      }
    });
  }

  function collectSolutionDataQuerySnapshot(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var pct = panel && panel.querySelector(".js-data-prep-transform-pct-of-landscape");
    var usePct = panel && panel.querySelector(".js-data-prep-transform-use-percent");
    var pickHidden = panel && panel.querySelector(".js-landscape-pick-value");
    return {
      name: (mainTr.querySelector(".js-data-prep-name") || {}).value || "",
      rows: (mainTr.querySelector(".js-data-prep-rows") || {}).value || "",
      queriesPerYear: (mainTr.querySelector(".js-solution-query-frequency") || {}).value || "",
      usePercent: !!(usePct && usePct.checked),
      pct: (pct && pct.value) || "10",
      pickJson: (pickHidden && pickHidden.value) || "",
      expanded: !advTr.hasAttribute("hidden"),
    };
  }

  function applySolutionDataQuerySnapshot(mainTr, advTr, snap) {
    if (!snap) {
      return;
    }
    var nameEl = mainTr.querySelector(".js-data-prep-name");
    var rowsEl = mainTr.querySelector(".js-data-prep-rows");
    var qpyEl = mainTr.querySelector(".js-solution-query-frequency");
    if (nameEl && snap.name != null) {
      nameEl.value = snap.name;
    }
    if (rowsEl && snap.rows != null) {
      rowsEl.value = snap.rows;
    }
    if (qpyEl && snap.queriesPerYear != null) {
      qpyEl.value = snap.queriesPerYear;
    }
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var usePct = panel && panel.querySelector(".js-data-prep-transform-use-percent");
    var usePick = panel && panel.querySelector(".js-data-prep-transform-use-pick");
    var pctIn = panel && panel.querySelector(".js-data-prep-transform-pct-of-landscape");
    var pickHidden = panel && panel.querySelector(".js-landscape-pick-value");
    if (usePct && usePick) {
      usePct.checked = snap.usePercent !== false;
      usePick.checked = !usePct.checked;
    }
    if (pctIn && snap.pct != null) {
      pctIn.value = snap.pct;
    }
    if (pickHidden && snap.pickJson != null && String(snap.pickJson).trim()) {
      pickHidden.value = snap.pickJson;
    }
    if (panel) {
      updateTransformSizingColumnsVisual(panel);
    }
    var pickRoot = panel && panel.querySelector(".js-landscape-pick");
    if (pickRoot && typeof pickRoot._landscapePickRefresh === "function") {
      pickRoot._landscapePickRefresh();
    }
    syncTransformRowsForCurrentMode(mainTr, advTr);
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    if (snap.expanded) {
      advTr.removeAttribute("hidden");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "true");
      }
      mainTr.classList.add("data-prep-item--expanded");
    } else {
      advTr.setAttribute("hidden", "");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "false");
      }
      mainTr.classList.remove("data-prep-item--expanded");
    }
  }

  function bindSolutionDataQueryRowPair(mainTr, advTr, tbody, uid, sectionRoot) {
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    var cloneBtn = mainTr.querySelector(".js-data-prep-clone");
    var delBtn = mainTr.querySelector(".js-data-prep-delete");
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    var qpyIn = mainTr.querySelector(".js-solution-query-frequency");

    if (rowsIn) {
      attachCommaFormatting(rowsIn);
    }
    if (qpyIn) {
      attachCommaFormatting(qpyIn);
    }
    if (panel) {
      var pickRoot = panel.querySelector(".js-landscape-pick");
      if (pickRoot) {
        initLandscapePick(pickRoot);
      }
      bindDataPrepDualSizingAdvanced(mainTr, advTr);
    }
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var expanded = editBtn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          advTr.setAttribute("hidden", "");
          editBtn.setAttribute("aria-expanded", "false");
          mainTr.classList.remove("data-prep-item--expanded");
        } else {
          advTr.removeAttribute("hidden");
          editBtn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      });
    }
    if (cloneBtn) {
      cloneBtn.addEventListener("click", function () {
        var snap = collectSolutionDataQuerySnapshot(mainTr, advTr);
        var base = String(snap.name || "").trim();
        snap.name = (base ? base : "Data Query 1") + " (2)";
        addSolutionDataQueryRow(tbody, uid, sectionRoot, snap, advTr);
      });
    }
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        advTr.remove();
        mainTr.remove();
        refreshSolutionCapabilitySectionVisibility(sectionRoot);
      });
    }
  }

  function addSolutionDataQueryRow(tbody, uid, sectionRoot, snapshot, insertAfterAdvancedTr) {
    if (!tbody) {
      return;
    }
    var n = tbody.querySelectorAll("tr.data-prep-item__main").length + 1;
    var mainTr = document.createElement("tr");
    mainTr.className = "data-prep-item__main";
    mainTr.innerHTML =
      "<td><input type=\"text\" class=\"input input--block js-data-prep-name\" autocomplete=\"off\" aria-label=\"Name\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-data-prep-rows js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Rows Processed\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-solution-query-frequency js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Queries per Year\" /></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-edit\" aria-expanded=\"false\" aria-label=\"Edit row details\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\" /><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-clone\" aria-label=\"Duplicate this data query row\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" /><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-delete\" aria-label=\"Delete this data query row\">×</button></td>";
    var advTr = document.createElement("tr");
    advTr.className = "data-prep-item__advanced";
    advTr.setAttribute("hidden", "");
    advTr.innerHTML =
      "<td class=\"data-prep-item__advanced-cell\" colspan=\"6\"><div class=\"data-prep-advanced-panel detail-list detail-list--boxed js-data-prep-advanced-panel\"><div class=\"data-prep-subrow data-prep-subrow--last\"><div class=\"data-prep-transform-sizing\" role=\"group\" aria-label=\"Rows processed sizing\"><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--percent js-data-prep-transform-col-percent\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-data-prep-transform-use-percent\" checked aria-label=\"Use percent of total data landscape for rows processed\" /><span class=\"data-prep-transform-sizing__title\">Percent of Total Data Landscape</span></label><div class=\"data-prep-transform-sizing__body\"><p class=\"hint data-prep-transform-sizing__hint\">Rows processed equals this percentage of all row volume across the full Data Landscape.</p><input type=\"text\" inputmode=\"decimal\" class=\"input input--block js-data-prep-transform-pct-of-landscape\" value=\"10\" placeholder=\"e.g. 10\" autocomplete=\"off\" aria-label=\"Percent of total data landscape\" /></div></div><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--pick js-data-prep-transform-col-pick\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-data-prep-transform-use-pick\" aria-label=\"Use data source selection for rows processed\" /><span class=\"data-prep-transform-sizing__title\">Data Source Selection</span></label><div class=\"data-prep-transform-sizing__body\"><p class=\"hint landscape-pick__hint\">Select data sources and/or individual objects from the Data Landscape. Choosing a source selects every object under it.</p><div class=\"landscape-pick js-landscape-pick\"><input type=\"hidden\" class=\"js-landscape-pick-value\" value=\"\" autocomplete=\"off\" /><button type=\"button\" class=\"landscape-pick__toggle js-landscape-pick-toggle\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"landscape-pick__summary js-landscape-pick-summary\">Select sources or objects…</span><span class=\"landscape-pick__caret\" aria-hidden=\"true\"></span></button><div class=\"landscape-pick__menu js-landscape-pick-menu\" hidden role=\"group\" aria-label=\"Data sources and objects\"></div></div></div></div></div></div></div></td>";

    if (insertAfterAdvancedTr && insertAfterAdvancedTr.parentNode === tbody) {
      var ref = insertAfterAdvancedTr.nextSibling;
      tbody.insertBefore(mainTr, ref);
      tbody.insertBefore(advTr, mainTr.nextSibling);
    } else {
      tbody.appendChild(mainTr);
      tbody.appendChild(advTr);
    }
    var nameIn = mainTr.querySelector(".js-data-prep-name");
    if (nameIn && !snapshot) {
      nameIn.value = "Data Query " + n;
    }
    bindSolutionDataQueryRowPair(mainTr, advTr, tbody, uid, sectionRoot);
    if (snapshot) {
      applySolutionDataQuerySnapshot(mainTr, advTr, snapshot);
    }
    formatNumericFieldsIn(mainTr);
    refreshSolutionCapabilitySectionVisibility(sectionRoot);
  }

  function syncSolutionSegPublishEditable(mainTr) {
    if (!mainTr) {
      return;
    }
    var chk = mainTr.querySelector(".js-solution-seg-publish-attrs");
    var pop = mainTr.querySelector(".js-solution-seg-publish-pop");
    if (!chk || !pop) {
      return;
    }
    if (chk.checked) {
      pop.readOnly = false;
      pop.removeAttribute("aria-disabled");
      pop.setAttribute("aria-label", "Estimated publish population");
      attachCommaFormatting(pop);
    } else {
      pop.readOnly = true;
      pop.setAttribute("aria-disabled", "true");
      pop.setAttribute("aria-label", "Estimated publish population (enable publish related attributes to edit)");
      pop.value = formatEnUSNumber(0);
    }
  }

  function collectSolutionSegmentationSnapshot(mainTr, advTr) {
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var pct = panel && panel.querySelector(".js-data-prep-transform-pct-of-landscape");
    var usePct = panel && panel.querySelector(".js-data-prep-transform-use-percent");
    var pickHidden = panel && panel.querySelector(".js-landscape-pick-value");
    var freq = mainTr.querySelector(".js-solution-seg-frequency");
    var publish = mainTr.querySelector(".js-solution-seg-publish-attrs");
    return {
      name: (mainTr.querySelector(".js-data-prep-name") || {}).value || "",
      rows: (mainTr.querySelector(".js-data-prep-rows") || {}).value || "",
      freqValue: (freq && freq.value) || "daily",
      publishAttrs: !!(publish && publish.checked),
      estPopulation: (mainTr.querySelector(".js-solution-seg-publish-pop") || {}).value || "",
      usePercent: !!(usePct && usePct.checked),
      pct: (pct && pct.value) || "10",
      pickJson: (pickHidden && pickHidden.value) || "",
      expanded: !advTr.hasAttribute("hidden"),
    };
  }

  function applySolutionSegmentationSnapshot(mainTr, advTr, snap) {
    if (!snap) {
      return;
    }
    var nameEl = mainTr.querySelector(".js-data-prep-name");
    var rowsEl = mainTr.querySelector(".js-data-prep-rows");
    var freqEl = mainTr.querySelector(".js-solution-seg-frequency");
    var pubChk = mainTr.querySelector(".js-solution-seg-publish-attrs");
    var estPopEl = mainTr.querySelector(".js-solution-seg-publish-pop");
    if (nameEl && snap.name != null) {
      nameEl.value = snap.name;
    }
    if (rowsEl && snap.rows != null) {
      rowsEl.value = snap.rows;
    }
    if (freqEl && snap.freqValue != null) {
      freqEl.value = snap.freqValue;
    }
    if (pubChk) {
      pubChk.checked = !!snap.publishAttrs;
    }
    if (estPopEl && snap.estPopulation != null && String(snap.estPopulation).trim() !== "") {
      estPopEl.value = snap.estPopulation;
    }
    syncSolutionSegPublishEditable(mainTr);
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var usePct = panel && panel.querySelector(".js-data-prep-transform-use-percent");
    var usePick = panel && panel.querySelector(".js-data-prep-transform-use-pick");
    var pctIn = panel && panel.querySelector(".js-data-prep-transform-pct-of-landscape");
    var pickHidden = panel && panel.querySelector(".js-landscape-pick-value");
    if (usePct && usePick) {
      usePct.checked = snap.usePercent !== false;
      usePick.checked = !usePct.checked;
    }
    if (pctIn && snap.pct != null) {
      pctIn.value = snap.pct;
    }
    if (pickHidden && snap.pickJson != null && String(snap.pickJson).trim()) {
      pickHidden.value = snap.pickJson;
    }
    if (panel) {
      updateTransformSizingColumnsVisual(panel);
    }
    var pickRoot = panel && panel.querySelector(".js-landscape-pick");
    if (pickRoot && typeof pickRoot._landscapePickRefresh === "function") {
      pickRoot._landscapePickRefresh();
    }
    syncTransformRowsForCurrentMode(mainTr, advTr);
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    if (snap.expanded) {
      advTr.removeAttribute("hidden");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "true");
      }
      mainTr.classList.add("data-prep-item--expanded");
    } else {
      advTr.setAttribute("hidden", "");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "false");
      }
      mainTr.classList.remove("data-prep-item--expanded");
    }
  }

  function bindSolutionSegmentationRowPair(mainTr, advTr, tbody, uid, sectionRoot) {
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    var cloneBtn = mainTr.querySelector(".js-data-prep-clone");
    var delBtn = mainTr.querySelector(".js-data-prep-delete");
    var panel = advTr.querySelector(".js-data-prep-advanced-panel");
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    var estPopIn = mainTr.querySelector(".js-solution-seg-publish-pop");
    var pubChk = mainTr.querySelector(".js-solution-seg-publish-attrs");
    if (rowsIn) {
      attachCommaFormatting(rowsIn);
    }
    if (estPopIn) {
      attachCommaFormatting(estPopIn);
    }
    if (pubChk) {
      pubChk.addEventListener("change", function () {
        syncSolutionSegPublishEditable(mainTr);
      });
      syncSolutionSegPublishEditable(mainTr);
    }
    if (panel) {
      var pickRoot = panel.querySelector(".js-landscape-pick");
      if (pickRoot) {
        initLandscapePick(pickRoot);
      }
      bindDataPrepDualSizingAdvanced(mainTr, advTr);
    }
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var expanded = editBtn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          advTr.setAttribute("hidden", "");
          editBtn.setAttribute("aria-expanded", "false");
          mainTr.classList.remove("data-prep-item--expanded");
        } else {
          advTr.removeAttribute("hidden");
          editBtn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      });
    }
    if (cloneBtn) {
      cloneBtn.addEventListener("click", function () {
        var snap = collectSolutionSegmentationSnapshot(mainTr, advTr);
        var base = String(snap.name || "").trim();
        snap.name = (base ? base : "Segmentation & Activation 1") + " (2)";
        addSolutionSegmentationRow(tbody, uid, sectionRoot, snap, advTr);
      });
    }
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        advTr.remove();
        mainTr.remove();
        refreshSolutionCapabilitySectionVisibility(sectionRoot);
      });
    }
  }

  function addSolutionSegmentationRow(tbody, uid, sectionRoot, snapshot, insertAfterAdvancedTr) {
    if (!tbody) {
      return;
    }
    var n = tbody.querySelectorAll("tr.data-prep-item__main").length + 1;
    var mainTr = document.createElement("tr");
    mainTr.className = "data-prep-item__main";
    mainTr.innerHTML =
      "<td><input type=\"text\" class=\"input input--block js-data-prep-name\" autocomplete=\"off\" aria-label=\"Name\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-data-prep-rows js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Rows Processed\" /></td>" +
      "<td><div class=\"select-wrap\"><select class=\"select js-solution-seg-frequency\" aria-label=\"Frequency\"><option value=\"daily\">Daily</option><option value=\"hourly\">Hourly</option></select></div></td>" +
      "<td class=\"data-prep-item__cell-seg-publish\"><input type=\"checkbox\" class=\"check-row__input js-solution-seg-publish-attrs\" aria-label=\"Publish related attributes\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-solution-seg-publish-pop js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Estimated publish population\" /></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-edit\" aria-expanded=\"false\" aria-label=\"Edit row details\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\" /><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-clone\" aria-label=\"Duplicate this segmentation row\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" /><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-delete\" aria-label=\"Delete this segmentation row\">×</button></td>";
    var advTr = document.createElement("tr");
    advTr.className = "data-prep-item__advanced";
    advTr.setAttribute("hidden", "");
    advTr.innerHTML =
      "<td class=\"data-prep-item__advanced-cell\" colspan=\"8\"><div class=\"data-prep-advanced-panel detail-list detail-list--boxed js-data-prep-advanced-panel\"><div class=\"data-prep-subrow data-prep-subrow--last\"><div class=\"data-prep-transform-sizing\" role=\"group\" aria-label=\"Rows processed sizing\"><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--percent js-data-prep-transform-col-percent\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-data-prep-transform-use-percent\" checked aria-label=\"Use percent of total data landscape for rows processed\" /><span class=\"data-prep-transform-sizing__title\">Percent of Total Data Landscape</span></label><div class=\"data-prep-transform-sizing__body\"><p class=\"hint data-prep-transform-sizing__hint\">Rows processed equals this percentage of all row volume across the full Data Landscape.</p><input type=\"text\" inputmode=\"decimal\" class=\"input input--block js-data-prep-transform-pct-of-landscape\" value=\"10\" placeholder=\"e.g. 10\" autocomplete=\"off\" aria-label=\"Percent of total data landscape\" /></div></div><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--pick js-data-prep-transform-col-pick\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-data-prep-transform-use-pick\" aria-label=\"Use data source selection for rows processed\" /><span class=\"data-prep-transform-sizing__title\">Data Source Selection</span></label><div class=\"data-prep-transform-sizing__body\"><p class=\"hint landscape-pick__hint\">Select data sources and/or individual objects from the Data Landscape. Choosing a source selects every object under it.</p><div class=\"landscape-pick js-landscape-pick\"><input type=\"hidden\" class=\"js-landscape-pick-value\" value=\"\" autocomplete=\"off\" /><button type=\"button\" class=\"landscape-pick__toggle js-landscape-pick-toggle\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"landscape-pick__summary js-landscape-pick-summary\">Select sources or objects…</span><span class=\"landscape-pick__caret\" aria-hidden=\"true\"></span></button><div class=\"landscape-pick__menu js-landscape-pick-menu\" hidden role=\"group\" aria-label=\"Data sources and objects\"></div></div></div></div></div></div></div></td>";
    if (insertAfterAdvancedTr && insertAfterAdvancedTr.parentNode === tbody) {
      var ref = insertAfterAdvancedTr.nextSibling;
      tbody.insertBefore(mainTr, ref);
      tbody.insertBefore(advTr, mainTr.nextSibling);
    } else {
      tbody.appendChild(mainTr);
      tbody.appendChild(advTr);
    }
    var nameIn = mainTr.querySelector(".js-data-prep-name");
    if (nameIn && !snapshot) {
      nameIn.value = "Segmentation & Activation " + n;
    }
    bindSolutionSegmentationRowPair(mainTr, advTr, tbody, uid, sectionRoot);
    if (snapshot) {
      applySolutionSegmentationSnapshot(mainTr, advTr, snapshot);
    }
    formatNumericFieldsIn(mainTr);
    refreshSolutionCapabilitySectionVisibility(sectionRoot);
  }

  function getAverageStreamingObjectRows() {
    var cat = getLandscapeCatalog();
    var sum = 0;
    var n = 0;
    cat.forEach(function (src) {
      if (src && src.dataType === STREAMING_EVENTS) {
        (src.objects || []).forEach(function (obj) {
          sum += Number(obj.rows) || 0;
          n += 1;
        });
      }
    });
    if (n === 0) {
      return 0;
    }
    return sum / n;
  }

  function getStreamingObjectsCatalog() {
    var cat = getLandscapeCatalog();
    var out = [];
    cat.forEach(function (src) {
      if (!src || src.dataType !== STREAMING_EVENTS) {
        return;
      }
      (src.objects || []).forEach(function (obj) {
        out.push({
          id: obj.pickId,
          sourceName: src.name,
          objectName: obj.label,
          rows: Number(obj.rows) || 0,
        });
      });
    });
    return out;
  }

  function getCustomerRecordObjectsCatalog() {
    var cat = getLandscapeCatalog();
    var out = [];
    cat.forEach(function (src) {
      if (!src || src.dataType !== CUSTOMER_RECORDS) {
        return;
      }
      (src.objects || []).forEach(function (obj) {
        out.push({
          id: obj.pickId,
          sourceName: src.name,
          objectName: obj.label,
          rows: Number(obj.rows) || 0,
        });
      });
    });
    return out;
  }

  function refreshStreamingObjectSelect(selectEl) {
    if (!selectEl) {
      return;
    }
    var current = String(selectEl.value || "");
    var objs = getStreamingObjectsCatalog();
    selectEl.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = objs.length > 0 ? "Select one streaming object" : "No streaming objects available";
    selectEl.appendChild(placeholder);
    objs.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = o.sourceName + " - " + o.objectName;
      selectEl.appendChild(opt);
    });
    var hasCurrent = objs.some(function (o) {
      return o.id === current;
    });
    selectEl.value = hasCurrent ? current : "";
  }

  function refreshCustomerObjectSelect(selectEl) {
    if (!selectEl) {
      return;
    }
    var current = String(selectEl.value || "");
    var objs = getCustomerRecordObjectsCatalog();
    selectEl.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = objs.length > 0 ? "Select one customer object" : "No customer record objects available";
    selectEl.appendChild(placeholder);
    objs.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = o.sourceName + " - " + o.objectName;
      selectEl.appendChild(opt);
    });
    var hasCurrent = objs.some(function (o) {
      return o.id === current;
    });
    selectEl.value = hasCurrent ? current : "";
  }

  function syncSolutionStreamingRowsForMode(mainTr, advTr) {
    if (!mainTr || !advTr) {
      return;
    }
    var rowsEl = mainTr.querySelector(".js-data-prep-rows");
    if (!rowsEl) {
      return;
    }
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    if (!panel) {
      return;
    }
    var isTransformsPanel = panel.classList.contains("js-solution-streaming-transforms-advanced");
    var useAvg = panel.querySelector(".js-solution-streaming-use-avg");
    var usePick = panel.querySelector(".js-solution-streaming-use-pick");
    var pickSel = panel.querySelector(".js-solution-streaming-object-pick");
    var useCustomer = panel.querySelector(".js-solution-streaming-use-customer");
    var useCustomerAvg = panel.querySelector(".js-solution-streaming-use-customer-avg");
    var customerSel = panel.querySelector(".js-solution-customer-object-pick");
    var includeLookup = mainTr.querySelector(".js-solution-streaming-include-lookups");

    function getTriggerValue() {
      if (useAvg && useAvg.checked) {
        return getAverageStreamingObjectRows();
      }
      if (usePick && usePick.checked) {
        var id = pickSel ? String(pickSel.value || "") : "";
        var objs = getStreamingObjectsCatalog();
        var picked = objs.find(function (o) {
          return o.id === id;
        });
        return picked ? picked.rows : 0;
      }
      return 0;
    }

    function getEnrichmentValue() {
      if (!includeLookup || !includeLookup.checked) {
        return 1;
      }
      if (useCustomerAvg && useCustomerAvg.checked) {
        var cObjsAvg = getCustomerRecordObjectsCatalog();
        if (!cObjsAvg.length) {
          return 0;
        }
        var cSum = 0;
        cObjsAvg.forEach(function (o) {
          cSum += Number(o.rows) || 0;
        });
        return cSum / cObjsAvg.length;
      }
      if (useCustomer && useCustomer.checked) {
        var cid = customerSel ? String(customerSel.value || "") : "";
        var cObjs = getCustomerRecordObjectsCatalog();
        var cPicked = cObjs.find(function (o) {
          return o.id === cid;
        });
        return cPicked ? cPicked.rows : 0;
      }
      return 0;
    }

    var triggerVal = getTriggerValue();
    if (isTransformsPanel) {
      var enrichmentVal = getEnrichmentValue();
      rowsEl.value = formatEnUSNumber(Math.round(triggerVal * enrichmentVal));
      return;
    }

    if (!isTransformsPanel && useCustomer && useCustomer.checked) {
      var cid = customerSel ? String(customerSel.value || "") : "";
      var cObjs = getCustomerRecordObjectsCatalog();
      var cPicked = cObjs.find(function (o) {
        return o.id === cid;
      });
      rowsEl.value = formatEnUSNumber(Math.round(cPicked ? cPicked.rows : 0));
      return;
    }
    rowsEl.value = formatEnUSNumber(Math.round(triggerVal));
  }

  function syncAllSolutionStreamingRows() {
    [".js-solution-streaming-tbody", ".js-solution-streaming-insights-tbody", ".js-solution-streaming-transforms-tbody"].forEach(function (selRoot) {
      document.querySelectorAll(selRoot + " tr.data-prep-item__main").forEach(function (mainTr) {
        var advTr = mainTr.nextElementSibling;
        if (!advTr || !advTr.classList.contains("data-prep-item__advanced")) {
          return;
        }
        var sel = advTr.querySelector(".js-solution-streaming-object-pick");
        if (sel) {
          refreshStreamingObjectSelect(sel);
        }
        var cSel = advTr.querySelector(".js-solution-customer-object-pick");
        if (cSel) {
          refreshCustomerObjectSelect(cSel);
        }
        syncSolutionStreamingRowsForMode(mainTr, advTr);
      });
    });
  }

  function updateSolutionStreamingColumnsVisual(panel) {
    if (!panel) {
      return;
    }
    var colAvg = panel.querySelector(".js-solution-streaming-col-avg");
    var colPick = panel.querySelector(".js-solution-streaming-col-pick");
    var colCustomer = panel.querySelector(".js-solution-streaming-col-customer");
    var useAvg = panel.querySelector(".js-solution-streaming-use-avg");
    var usePick = panel.querySelector(".js-solution-streaming-use-pick");
    var useCustomer = panel.querySelector(".js-solution-streaming-use-customer");
    var useCustomerAvg = panel.querySelector(".js-solution-streaming-use-customer-avg");
    if (!colAvg || !colPick || !useAvg) {
      return;
    }
    var avgActive = !!useAvg.checked;
    var pickActive = !!(usePick && usePick.checked);
    var customerActive = !!((useCustomer && useCustomer.checked) || (useCustomerAvg && useCustomerAvg.checked));
    colAvg.classList.toggle("data-prep-transform-sizing__col--active", avgActive);
    colAvg.classList.toggle("data-prep-transform-sizing__col--dim", !avgActive);
    colPick.classList.toggle("data-prep-transform-sizing__col--active", pickActive);
    colPick.classList.toggle("data-prep-transform-sizing__col--dim", !pickActive);
    if (colCustomer) {
      colCustomer.classList.toggle("data-prep-transform-sizing__col--active", customerActive);
      colCustomer.classList.toggle("data-prep-transform-sizing__col--dim", !customerActive);
    }
  }

  function syncSolutionStreamingTransformsEnrichmentState(mainTr, advTr, forceDefaultWhenEnabled) {
    if (!mainTr || !advTr) {
      return;
    }
    var includeLookup = mainTr.querySelector(".js-solution-streaming-include-lookups");
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    if (!panel || !panel.classList.contains("js-solution-streaming-transforms-advanced")) {
      return;
    }
    var group = panel.querySelector(".js-solution-streaming-enrichment-group");
    var useCustomerAvg = panel.querySelector(".js-solution-streaming-use-customer-avg");
    var useCustomer = panel.querySelector(".js-solution-streaming-use-customer");
    var customerSel = panel.querySelector(".js-solution-customer-object-pick");
    var enabled = !!(includeLookup && includeLookup.checked);

    if (group) {
      group.classList.toggle("solution-streaming-edit-group--disabled", !enabled);
      group.setAttribute("aria-disabled", enabled ? "false" : "true");
    }
    if (useCustomerAvg) {
      useCustomerAvg.disabled = !enabled;
    }
    if (useCustomer) {
      useCustomer.disabled = !enabled;
    }
    if (customerSel) {
      customerSel.disabled = !enabled;
    }
    if (!enabled) {
      if (useCustomerAvg) {
        useCustomerAvg.checked = false;
      }
      if (useCustomer) {
        useCustomer.checked = false;
      }
    } else {
      var shouldDefault = !!forceDefaultWhenEnabled;
      if (useCustomerAvg && useCustomer) {
        if (shouldDefault || (!useCustomerAvg.checked && !useCustomer.checked)) {
          useCustomerAvg.checked = true;
          useCustomer.checked = false;
        }
      }
    }
    updateSolutionStreamingColumnsVisual(panel);
  }

  function collectSolutionStreamingSnapshot(mainTr, advTr) {
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    var useAvg = panel && panel.querySelector(".js-solution-streaming-use-avg");
    var pickSel = panel && panel.querySelector(".js-solution-streaming-object-pick");
    var useCustomer = panel && panel.querySelector(".js-solution-streaming-use-customer");
    var useCustomerAvg = panel && panel.querySelector(".js-solution-streaming-use-customer-avg");
    var customerSel = panel && panel.querySelector(".js-solution-customer-object-pick");
    var includeLookup = mainTr.querySelector(".js-solution-streaming-include-lookups");
    return {
      name: (mainTr.querySelector(".js-data-prep-name") || {}).value || "",
      rows: (mainTr.querySelector(".js-data-prep-rows") || {}).value || "",
      includeLookups: !!(includeLookup && includeLookup.checked),
      useAverage: !!(useAvg && useAvg.checked),
      pickedObject: (pickSel && pickSel.value) || "",
      useCustomer: !!(useCustomer && useCustomer.checked),
      useCustomerAvg: !!(useCustomerAvg && useCustomerAvg.checked),
      pickedCustomerObject: (customerSel && customerSel.value) || "",
      expanded: !advTr.hasAttribute("hidden"),
    };
  }

  function applySolutionStreamingSnapshot(mainTr, advTr, snap) {
    if (!snap) {
      return;
    }
    var nameEl = mainTr.querySelector(".js-data-prep-name");
    var rowsEl = mainTr.querySelector(".js-data-prep-rows");
    var lookupEl = mainTr.querySelector(".js-solution-streaming-include-lookups");
    if (nameEl && snap.name != null) {
      nameEl.value = snap.name;
    }
    if (rowsEl && snap.rows != null) {
      rowsEl.value = snap.rows;
    }
    if (lookupEl) {
      lookupEl.checked = !!snap.includeLookups;
    }
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    var useAvg = panel && panel.querySelector(".js-solution-streaming-use-avg");
    var usePick = panel && panel.querySelector(".js-solution-streaming-use-pick");
    var useCustomer = panel && panel.querySelector(".js-solution-streaming-use-customer");
    var useCustomerAvg = panel && panel.querySelector(".js-solution-streaming-use-customer-avg");
    var pickSel = panel && panel.querySelector(".js-solution-streaming-object-pick");
    var customerSel = panel && panel.querySelector(".js-solution-customer-object-pick");
    if (pickSel) {
      refreshStreamingObjectSelect(pickSel);
      if (snap.pickedObject != null) {
        pickSel.value = snap.pickedObject;
      }
    }
    if (customerSel) {
      refreshCustomerObjectSelect(customerSel);
      if (snap.pickedCustomerObject != null) {
        customerSel.value = snap.pickedCustomerObject;
      }
    }
    if (useAvg && usePick) {
      var useCustomerMode = !!(useCustomer && snap.useCustomer);
      useAvg.checked = !useCustomerMode && snap.useAverage !== false;
      usePick.checked = !useCustomerMode && !useAvg.checked;
      if (useCustomer) {
        useCustomer.checked = useCustomerMode;
      }
    }
    if (useCustomerAvg) {
      useCustomerAvg.checked = snap.useCustomerAvg !== false;
      if (useCustomer && snap.useCustomer) {
        useCustomerAvg.checked = false;
      }
      if (!useCustomer && !useCustomerAvg.checked) {
        useCustomerAvg.checked = true;
      }
    }
    syncSolutionStreamingTransformsEnrichmentState(mainTr, advTr, false);
    updateSolutionStreamingColumnsVisual(panel);
    syncSolutionStreamingRowsForMode(mainTr, advTr);
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    if (snap.expanded) {
      advTr.removeAttribute("hidden");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "true");
      }
      mainTr.classList.add("data-prep-item--expanded");
    } else {
      advTr.setAttribute("hidden", "");
      if (editBtn) {
        editBtn.setAttribute("aria-expanded", "false");
      }
      mainTr.classList.remove("data-prep-item--expanded");
    }
  }

  function bindSolutionStreamingRowPair(mainTr, advTr, tbody, uid, sectionRoot) {
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    var cloneBtn = mainTr.querySelector(".js-data-prep-clone");
    var delBtn = mainTr.querySelector(".js-data-prep-delete");
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    if (rowsIn) {
      attachCommaFormatting(rowsIn);
    }
    var useAvg = panel && panel.querySelector(".js-solution-streaming-use-avg");
    var usePick = panel && panel.querySelector(".js-solution-streaming-use-pick");
    var pickSel = panel && panel.querySelector(".js-solution-streaming-object-pick");
    if (pickSel) {
      refreshStreamingObjectSelect(pickSel);
      pickSel.addEventListener("change", function () {
        if (usePick && usePick.checked) {
          syncSolutionStreamingRowsForMode(mainTr, advTr);
        }
      });
    }
    function onModeChange() {
      updateSolutionStreamingColumnsVisual(panel);
      syncSolutionStreamingRowsForMode(mainTr, advTr);
    }
    if (useAvg && usePick) {
      useAvg.addEventListener("change", function () {
        if (useAvg.checked) {
          usePick.checked = false;
        } else {
          usePick.checked = true;
        }
        onModeChange();
      });
      usePick.addEventListener("change", function () {
        if (usePick.checked) {
          useAvg.checked = false;
        } else {
          useAvg.checked = true;
        }
        onModeChange();
      });
    }
    onModeChange();
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var expanded = editBtn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          advTr.setAttribute("hidden", "");
          editBtn.setAttribute("aria-expanded", "false");
          mainTr.classList.remove("data-prep-item--expanded");
        } else {
          advTr.removeAttribute("hidden");
          editBtn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      });
    }
    if (cloneBtn) {
      cloneBtn.addEventListener("click", function () {
        var snap = collectSolutionStreamingSnapshot(mainTr, advTr);
        var base = String(snap.name || "").trim();
        snap.name = (base ? base : "Streaming Action 1") + " (2)";
        addSolutionStreamingRow(tbody, uid, sectionRoot, snap, advTr);
      });
    }
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        advTr.remove();
        mainTr.remove();
        refreshSolutionCapabilitySectionVisibility(sectionRoot);
      });
    }
  }

  function addSolutionStreamingRow(tbody, uid, sectionRoot, snapshot, insertAfterAdvancedTr) {
    if (!tbody) {
      return;
    }
    var n = tbody.querySelectorAll("tr.data-prep-item__main").length + 1;
    var mainTr = document.createElement("tr");
    mainTr.className = "data-prep-item__main";
    mainTr.innerHTML =
      "<td><input type=\"text\" class=\"input input--block js-data-prep-name\" autocomplete=\"off\" aria-label=\"Name\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-data-prep-rows js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Rows Processed\" /></td>" +
      "<td class=\"data-prep-item__cell-streaming-lookup\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-include-lookups\" aria-label=\"Include lookups\" /></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-edit\" aria-expanded=\"false\" aria-label=\"Edit row details\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\" /><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-clone\" aria-label=\"Duplicate this streaming row\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" /><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-delete\" aria-label=\"Delete this streaming row\">×</button></td>";
    var advTr = document.createElement("tr");
    advTr.className = "data-prep-item__advanced";
    advTr.setAttribute("hidden", "");
    advTr.innerHTML =
      "<td class=\"data-prep-item__advanced-cell\" colspan=\"6\"><div class=\"data-prep-advanced-panel detail-list detail-list--boxed js-solution-streaming-advanced\"><div class=\"data-prep-subrow data-prep-subrow--last\"><div class=\"data-prep-transform-sizing\" role=\"group\" aria-label=\"Rows processed sizing\"><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--percent js-solution-streaming-col-avg\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-avg\" checked aria-label=\"Use average number of records for one Streaming Events object\" /><span class=\"data-prep-transform-sizing__title\">Average number of records for one Streaming Events object</span></label></div><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--pick js-solution-streaming-col-pick\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-pick\" aria-label=\"Use one streaming events object from data landscape\" /><span class=\"data-prep-transform-sizing__title\">Select one Streaming Events object</span></label><div class=\"data-prep-transform-sizing__body\"><div class=\"select-wrap\"><select class=\"select js-solution-streaming-object-pick\" aria-label=\"Streaming events object\"></select></div></div></div></div></div></div></td>";
    if (insertAfterAdvancedTr && insertAfterAdvancedTr.parentNode === tbody) {
      var ref = insertAfterAdvancedTr.nextSibling;
      tbody.insertBefore(mainTr, ref);
      tbody.insertBefore(advTr, mainTr.nextSibling);
    } else {
      tbody.appendChild(mainTr);
      tbody.appendChild(advTr);
    }
    var nameIn = mainTr.querySelector(".js-data-prep-name");
    if (nameIn && !snapshot) {
      nameIn.value = "Streaming Action " + n;
    }
    bindSolutionStreamingRowPair(mainTr, advTr, tbody, uid, sectionRoot);
    if (snapshot) {
      applySolutionStreamingSnapshot(mainTr, advTr, snapshot);
    }
    formatNumericFieldsIn(mainTr);
    refreshSolutionCapabilitySectionVisibility(sectionRoot);
  }

  function bindSolutionStreamingInsightsRowPair(mainTr, advTr, tbody, uid, sectionRoot) {
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    var cloneBtn = mainTr.querySelector(".js-data-prep-clone");
    var delBtn = mainTr.querySelector(".js-data-prep-delete");
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    if (rowsIn) {
      attachCommaFormatting(rowsIn);
    }
    var useAvg = panel && panel.querySelector(".js-solution-streaming-use-avg");
    var usePick = panel && panel.querySelector(".js-solution-streaming-use-pick");
    var pickSel = panel && panel.querySelector(".js-solution-streaming-object-pick");
    if (pickSel) {
      refreshStreamingObjectSelect(pickSel);
      pickSel.addEventListener("change", function () {
        if (usePick && usePick.checked) {
          syncSolutionStreamingRowsForMode(mainTr, advTr);
        }
      });
    }
    function onModeChange() {
      updateSolutionStreamingColumnsVisual(panel);
      syncSolutionStreamingRowsForMode(mainTr, advTr);
    }
    if (useAvg && usePick) {
      useAvg.addEventListener("change", function () {
        if (useAvg.checked) {
          usePick.checked = false;
        } else {
          usePick.checked = true;
        }
        onModeChange();
      });
      usePick.addEventListener("change", function () {
        if (usePick.checked) {
          useAvg.checked = false;
        } else {
          useAvg.checked = true;
        }
        onModeChange();
      });
    }
    onModeChange();
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var expanded = editBtn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          advTr.setAttribute("hidden", "");
          editBtn.setAttribute("aria-expanded", "false");
          mainTr.classList.remove("data-prep-item--expanded");
        } else {
          advTr.removeAttribute("hidden");
          editBtn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      });
    }
    if (cloneBtn) {
      cloneBtn.addEventListener("click", function () {
        var snap = collectSolutionStreamingSnapshot(mainTr, advTr);
        var base = String(snap.name || "").trim();
        snap.name = (base ? base : "Streaming Calculated Insight 1") + " (2)";
        addSolutionStreamingInsightsRow(tbody, uid, sectionRoot, snap, advTr);
      });
    }
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        advTr.remove();
        mainTr.remove();
        refreshSolutionCapabilitySectionVisibility(sectionRoot);
      });
    }
  }

  function addSolutionStreamingInsightsRow(tbody, uid, sectionRoot, snapshot, insertAfterAdvancedTr) {
    if (!tbody) {
      return;
    }
    var n = tbody.querySelectorAll("tr.data-prep-item__main").length + 1;
    var mainTr = document.createElement("tr");
    mainTr.className = "data-prep-item__main";
    mainTr.innerHTML =
      "<td><input type=\"text\" class=\"input input--block js-data-prep-name\" autocomplete=\"off\" aria-label=\"Name\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-data-prep-rows js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Rows Processed\" /></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-edit\" aria-expanded=\"false\" aria-label=\"Edit row details\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\" /><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-clone\" aria-label=\"Duplicate this streaming calculated insight row\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" /><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-delete\" aria-label=\"Delete this streaming calculated insight row\">×</button></td>";
    var advTr = document.createElement("tr");
    advTr.className = "data-prep-item__advanced";
    advTr.setAttribute("hidden", "");
    advTr.innerHTML =
      "<td class=\"data-prep-item__advanced-cell\" colspan=\"5\"><div class=\"data-prep-advanced-panel detail-list detail-list--boxed js-solution-streaming-advanced\"><div class=\"data-prep-subrow data-prep-subrow--last\"><div class=\"data-prep-transform-sizing\" role=\"group\" aria-label=\"Rows processed sizing\"><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--percent js-solution-streaming-col-avg\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-avg\" checked aria-label=\"Use average number of records for one Streaming Events object\" /><span class=\"data-prep-transform-sizing__title\">Average number of records for one Streaming Events object</span></label></div><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--pick js-solution-streaming-col-pick\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-pick\" aria-label=\"Use one streaming events object from data landscape\" /><span class=\"data-prep-transform-sizing__title\">Select one Streaming Events object</span></label><div class=\"data-prep-transform-sizing__body\"><div class=\"select-wrap\"><select class=\"select js-solution-streaming-object-pick\" aria-label=\"Streaming events object\"></select></div></div></div></div></div></div></td>";
    if (insertAfterAdvancedTr && insertAfterAdvancedTr.parentNode === tbody) {
      var ref = insertAfterAdvancedTr.nextSibling;
      tbody.insertBefore(mainTr, ref);
      tbody.insertBefore(advTr, mainTr.nextSibling);
    } else {
      tbody.appendChild(mainTr);
      tbody.appendChild(advTr);
    }
    var nameIn = mainTr.querySelector(".js-data-prep-name");
    if (nameIn && !snapshot) {
      nameIn.value = "Streaming Calculated Insight " + n;
    }
    bindSolutionStreamingInsightsRowPair(mainTr, advTr, tbody, uid, sectionRoot);
    if (snapshot) {
      applySolutionStreamingSnapshot(mainTr, advTr, snapshot);
    }
    formatNumericFieldsIn(mainTr);
    refreshSolutionCapabilitySectionVisibility(sectionRoot);
  }

  function bindSolutionStreamingTransformsRowPair(mainTr, advTr, tbody, uid, sectionRoot) {
    var editBtn = mainTr.querySelector(".js-data-prep-edit");
    var cloneBtn = mainTr.querySelector(".js-data-prep-clone");
    var delBtn = mainTr.querySelector(".js-data-prep-delete");
    var rowsIn = mainTr.querySelector(".js-data-prep-rows");
    var panel = advTr.querySelector(".js-solution-streaming-advanced");
    if (rowsIn) {
      attachCommaFormatting(rowsIn);
    }
    var useAvg = panel && panel.querySelector(".js-solution-streaming-use-avg");
    var usePick = panel && panel.querySelector(".js-solution-streaming-use-pick");
    var includeLookup = mainTr.querySelector(".js-solution-streaming-include-lookups");
    var useCustomer = panel && panel.querySelector(".js-solution-streaming-use-customer");
    var useCustomerAvg = panel && panel.querySelector(".js-solution-streaming-use-customer-avg");
    var pickSel = panel && panel.querySelector(".js-solution-streaming-object-pick");
    var customerSel = panel && panel.querySelector(".js-solution-customer-object-pick");
    if (pickSel) {
      refreshStreamingObjectSelect(pickSel);
      pickSel.addEventListener("change", function () {
        if (usePick && usePick.checked) {
          syncSolutionStreamingRowsForMode(mainTr, advTr);
        }
      });
    }
    if (customerSel) {
      refreshCustomerObjectSelect(customerSel);
      customerSel.addEventListener("change", function () {
        if (useCustomer && useCustomer.checked) {
          syncSolutionStreamingRowsForMode(mainTr, advTr);
        }
      });
    }
    function onModeChange() {
      updateSolutionStreamingColumnsVisual(panel);
      syncSolutionStreamingRowsForMode(mainTr, advTr);
    }
    if (useAvg && usePick) {
      useAvg.addEventListener("change", function () {
        if (useAvg.checked) {
          usePick.checked = false;
        } else if (!usePick.checked) {
          usePick.checked = true;
        }
        onModeChange();
      });
      usePick.addEventListener("change", function () {
        if (usePick.checked) {
          useAvg.checked = false;
        } else if (!useAvg.checked) {
          useAvg.checked = true;
        }
        onModeChange();
      });
    }
    if (useCustomer && useCustomerAvg) {
      useCustomer.addEventListener("change", function () {
        if (useCustomer.checked) {
          useCustomerAvg.checked = false;
        } else {
          useCustomerAvg.checked = true;
        }
        onModeChange();
      });
      useCustomerAvg.addEventListener("change", function () {
        if (useCustomerAvg.checked) {
          useCustomer.checked = false;
        } else if (!useCustomer.checked) {
          useCustomer.checked = true;
        }
        onModeChange();
      });
    }
    if (useCustomerAvg && !useCustomer) {
      useCustomerAvg.checked = true;
    }
    if (includeLookup) {
      includeLookup.addEventListener("change", function () {
        syncSolutionStreamingTransformsEnrichmentState(mainTr, advTr, includeLookup.checked);
        onModeChange();
      });
    }
    syncSolutionStreamingTransformsEnrichmentState(mainTr, advTr, false);
    onModeChange();
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var expanded = editBtn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          advTr.setAttribute("hidden", "");
          editBtn.setAttribute("aria-expanded", "false");
          mainTr.classList.remove("data-prep-item--expanded");
        } else {
          advTr.removeAttribute("hidden");
          editBtn.setAttribute("aria-expanded", "true");
          mainTr.classList.add("data-prep-item--expanded");
        }
      });
    }
    if (cloneBtn) {
      cloneBtn.addEventListener("click", function () {
        var snap = collectSolutionStreamingSnapshot(mainTr, advTr);
        var base = String(snap.name || "").trim();
        snap.name = (base ? base : "Streaming Data Transform 1") + " (2)";
        addSolutionStreamingTransformsRow(tbody, uid, sectionRoot, snap, advTr);
      });
    }
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        advTr.remove();
        mainTr.remove();
        refreshSolutionCapabilitySectionVisibility(sectionRoot);
      });
    }
  }

  function addSolutionStreamingTransformsRow(tbody, uid, sectionRoot, snapshot, insertAfterAdvancedTr) {
    if (!tbody) {
      return;
    }
    var n = tbody.querySelectorAll("tr.data-prep-item__main").length + 1;
    var mainTr = document.createElement("tr");
    mainTr.className = "data-prep-item__main";
    mainTr.innerHTML =
      "<td><input type=\"text\" class=\"input input--block js-data-prep-name\" autocomplete=\"off\" aria-label=\"Name\" /></td>" +
      "<td><input type=\"text\" inputmode=\"numeric\" class=\"input input--block js-data-prep-rows js-formatted-number\" value=\"0\" autocomplete=\"off\" aria-label=\"Rows Processed\" /></td>" +
      "<td class=\"data-prep-item__cell-streaming-lookup\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-include-lookups\" aria-label=\"Include lookup data\" /></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-edit\" aria-expanded=\"false\" aria-label=\"Edit row details\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\" /><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-clone\" aria-label=\"Duplicate this streaming transform row\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" /><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" /></svg></button></td>" +
      "<td class=\"data-prep-item__cell-action\"><button type=\"button\" class=\"btn btn--icon js-data-prep-delete\" aria-label=\"Delete this streaming transform row\">×</button></td>";
    var advTr = document.createElement("tr");
    advTr.className = "data-prep-item__advanced";
    advTr.setAttribute("hidden", "");
    advTr.innerHTML =
      "<td class=\"data-prep-item__advanced-cell\" colspan=\"6\"><div class=\"data-prep-advanced-panel detail-list detail-list--boxed js-solution-streaming-advanced js-solution-streaming-transforms-advanced\"><div class=\"data-prep-subrow data-prep-subrow--last\"><section class=\"solution-streaming-edit-group\" aria-label=\"Trigger source for transform jobs\"><h4 class=\"solution-streaming-edit-group__title\">Trigger Source</h4><p class=\"hint solution-streaming-edit-group__hint\">Choose how streaming transform jobs are triggered. Select one option.</p><div class=\"data-prep-transform-sizing\" role=\"group\" aria-label=\"Streaming transform trigger source\"><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--percent js-solution-streaming-col-avg\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-avg\" checked aria-label=\"Use average number of records for one Streaming Events object\" /><span class=\"data-prep-transform-sizing__title\">Average number of records for one Streaming Events object</span></label></div><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--pick js-solution-streaming-col-pick\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-pick\" aria-label=\"Use one streaming events object from data landscape\" /><span class=\"data-prep-transform-sizing__title\">Select one Streaming Events object</span></label><div class=\"data-prep-transform-sizing__body\"><div class=\"select-wrap\"><select class=\"select js-solution-streaming-object-pick\" aria-label=\"Streaming events object\"></select></div></div></div></div></section><section class=\"solution-streaming-edit-group solution-streaming-edit-group--optional js-solution-streaming-enrichment-group\" aria-label=\"Optional data enrichment\"><h4 class=\"solution-streaming-edit-group__title\">Optional Data Enrichment</h4><p class=\"hint solution-streaming-edit-group__hint\">Use this only when transform jobs must join against a Customer Records object.</p><div class=\"data-prep-transform-sizing\" role=\"group\" aria-label=\"Optional customer records enrichment\"><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--percent js-solution-streaming-col-customer\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-customer-avg\" checked aria-label=\"Use average number of records for one Customer Records object\" /><span class=\"data-prep-transform-sizing__title\">Average number of records for one Customer Records object</span></label></div><div class=\"data-prep-transform-sizing__col data-prep-transform-sizing__col--pick js-solution-streaming-col-customer\"><label class=\"data-prep-transform-sizing__header\"><input type=\"checkbox\" class=\"check-row__input js-solution-streaming-use-customer\" aria-label=\"Use one customer records object from data landscape\" /><span class=\"data-prep-transform-sizing__title\">Select one Customer Records object</span></label><div class=\"data-prep-transform-sizing__body\"><div class=\"select-wrap\"><select class=\"select js-solution-customer-object-pick\" aria-label=\"Customer records object\"></select></div></div></div></div></section></div></div></td>";
    if (insertAfterAdvancedTr && insertAfterAdvancedTr.parentNode === tbody) {
      var ref = insertAfterAdvancedTr.nextSibling;
      tbody.insertBefore(mainTr, ref);
      tbody.insertBefore(advTr, mainTr.nextSibling);
    } else {
      tbody.appendChild(mainTr);
      tbody.appendChild(advTr);
    }
    var nameIn = mainTr.querySelector(".js-data-prep-name");
    if (nameIn && !snapshot) {
      nameIn.value = "Streaming Data Transform " + n;
    }
    bindSolutionStreamingTransformsRowPair(mainTr, advTr, tbody, uid, sectionRoot);
    if (snapshot) {
      applySolutionStreamingSnapshot(mainTr, advTr, snapshot);
    }
    formatNumericFieldsIn(mainTr);
    refreshSolutionCapabilitySectionVisibility(sectionRoot);
  }

  function renderSolutionCapabilitySections(panel, uid) {
    if (!panel) {
      return;
    }
    var stack = panel.querySelector(".js-solution-capabilities-stack");
    if (!stack) {
      return;
    }
    stack.textContent = "";
    SOLUTION_DETAIL_CAPABILITIES.forEach(function (capability, capIdx) {
      var section = document.createElement("section");
      section.className = "data-prep-section solution-capability-section";
      var head = document.createElement("div");
      head.className = "data-prep-section__head";
      var title = document.createElement("h3");
      title.className = "data-prep-section__title";
      title.textContent = capability;
      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn btn--secondary btn--compact";
      addBtn.textContent = "+ Add";
      addBtn.setAttribute("aria-label", "Add row for " + capability);
      head.appendChild(title);
      head.appendChild(addBtn);
      section.appendChild(head);

      var tableWrap = document.createElement("div");
      tableWrap.className = "data-prep-table-scroll";
      tableWrap.setAttribute("hidden", "");
      var table = document.createElement("table");
      table.className =
        "data-prep-table " +
        (capability === "Data Queries"
          ? "data-prep-table--solution-data-query"
          : capability === "Segmentation & Activation"
            ? "data-prep-table--solution-seg-activation"
            : capability === "Streaming Actions"
              ? "data-prep-table--solution-streaming-actions"
              : capability === "Streaming Calculated Insights"
                ? "data-prep-table--solution-streaming-insights"
                : capability === "Streaming Data Transforms"
                  ? "data-prep-table--solution-streaming-transforms"
            : "data-prep-table--solution-detail");
      var thead = document.createElement("thead");
      thead.innerHTML =
        capability === "Data Queries"
          ? "<tr><th scope=\"col\">Name</th><th scope=\"col\">Rows Processed</th><th scope=\"col\">Queries per Year</th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Edit</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Duplicate</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Delete</span></th></tr>"
          : capability === "Segmentation & Activation"
            ? "<tr><th scope=\"col\">Name</th><th scope=\"col\">Rows Processed</th><th scope=\"col\">Frequency</th><th scope=\"col\">Publish Related Attributes?</th><th scope=\"col\">Est. Publish Population</th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Edit</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Duplicate</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Delete</span></th></tr>"
            : capability === "Streaming Actions"
              ? "<tr><th scope=\"col\">Name</th><th scope=\"col\">Rows Processed</th><th scope=\"col\">Include Lookups?</th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Edit</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Duplicate</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Delete</span></th></tr>"
              : capability === "Streaming Calculated Insights"
                ? "<tr><th scope=\"col\">Name</th><th scope=\"col\">Rows Processed</th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Edit</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Duplicate</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Delete</span></th></tr>"
                : capability === "Streaming Data Transforms"
                  ? "<tr><th scope=\"col\">Name</th><th scope=\"col\">Rows Processed</th><th scope=\"col\">Include Lookup Data?</th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Edit</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Duplicate</span></th><th scope=\"col\" class=\"data-prep-table__th-action\"><span class=\"sr-only\">Delete</span></th></tr>"
          : "<tr><th scope=\"col\">Capability</th><th scope=\"col\">Est. annual volume</th><th scope=\"col\">Notes</th></tr>";
      var tbody = document.createElement("tbody");
      tbody.className =
        capability === "Data Queries"
          ? "js-solution-data-query-tbody"
          : capability === "Segmentation & Activation"
            ? "js-solution-segmentation-tbody"
            : capability === "Streaming Actions"
              ? "js-solution-streaming-tbody"
              : capability === "Streaming Calculated Insights"
                ? "js-solution-streaming-insights-tbody"
                : capability === "Streaming Data Transforms"
                  ? "js-solution-streaming-transforms-tbody"
          : "js-solution-capabilities-tbody";
      table.appendChild(thead);
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      section.appendChild(tableWrap);
      stack.appendChild(section);

      addBtn.addEventListener("click", function () {
        if (capability === "Data Queries") {
          addSolutionDataQueryRow(tbody, uid, stack);
        } else if (capability === "Segmentation & Activation") {
          addSolutionSegmentationRow(tbody, uid, stack);
        } else if (capability === "Streaming Actions") {
          addSolutionStreamingRow(tbody, uid, stack);
        } else if (capability === "Streaming Calculated Insights") {
          addSolutionStreamingInsightsRow(tbody, uid, stack);
        } else if (capability === "Streaming Data Transforms") {
          addSolutionStreamingTransformsRow(tbody, uid, stack);
        } else {
          appendSolutionCapabilityRow(tbody, uid, capability);
        }
        refreshSolutionCapabilitySectionVisibility(stack);
      });
      var obs = new MutationObserver(function () {
        refreshSolutionCapabilitySectionVisibility(stack);
      });
      obs.observe(tbody, { childList: true });
      if (capIdx === SOLUTION_DETAIL_CAPABILITIES.length - 1) {
        refreshSolutionCapabilitySectionVisibility(stack);
      }
    });
  }

  function applyCreateYourOwnCardLayout(article, tpl, uid) {
    article.classList.add("solution-card--create-your-own");

    var accordions = article.querySelectorAll(".solution-card__accordion");
    if (accordions.length < 2) {
      return;
    }
    var firstAcc = accordions[0];
    var firstToggle = firstAcc.querySelector(".js-solution-accordion-toggle");
    var firstPanel = firstAcc.querySelector(".js-solution-questions-panel");
    var titleEl = firstToggle && firstToggle.querySelector(".solution-card__accordion-title");
    if (titleEl) {
      titleEl.textContent = "Notes";
    }
    if (firstToggle) {
      firstToggle.setAttribute("aria-expanded", "false");
    }
    if (firstPanel) {
      firstPanel.setAttribute("hidden", "");
    }

    var qWrap = article.querySelector(".js-solution-questions");
    if (qWrap) {
      qWrap.textContent = "";
      var noteWrap = document.createElement("div");
      noteWrap.className = "solution-card__question";
      var lab = document.createElement("label");
      lab.className = "field__label";
      lab.setAttribute("for", "solution-notes-" + uid);
      lab.textContent = "Capture discovery notes, stakeholders, or context for this custom solution.";
      var ta = document.createElement("textarea");
      ta.id = "solution-notes-" + uid;
      ta.className = "input input--block solution-card__textarea";
      ta.rows = 5;
      ta.placeholder = "Optional notes…";
      ta.setAttribute("aria-label", "Notes for custom solution");
      noteWrap.appendChild(lab);
      noteWrap.appendChild(ta);
      qWrap.appendChild(noteWrap);
    }

    var secondAcc = accordions[1];
    var secondToggle = secondAcc.querySelector(".js-solution-accordion-toggle");
    var secondPanel = secondAcc.querySelector(".js-solution-details-panel");
    if (secondToggle) {
      secondToggle.setAttribute("aria-expanded", "true");
    }
    if (secondPanel) {
      secondPanel.removeAttribute("hidden");
      var hint = secondPanel.querySelector(".solution-card__details-hint");
      if (hint) {
        hint.textContent =
          "Add capabilities to describe what you are assembling. Each section follows the same add-and-build flow as Data Prep.";
      }
    }
  }

  function bindSolutionAccordionToggles(article, uid) {
    var accIdx = 0;
    article.querySelectorAll(".js-solution-accordion-toggle").forEach(function (btn) {
      var panel = btn.nextElementSibling;
      if (!panel || !panel.classList.contains("solution-card__accordion-panel")) {
        return;
      }
      accIdx += 1;
      var pid = "solution-acc-" + uid + "-" + accIdx;
      panel.id = pid;
      btn.setAttribute("aria-controls", pid);
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        if (open) {
          panel.setAttribute("hidden", "");
        } else {
          panel.removeAttribute("hidden");
        }
      });
    });
  }

  function buildSolutionQuestionFields(container, questions, uid) {
    if (!container) {
      return;
    }
    container.textContent = "";
    (questions || []).forEach(function (qSpec, idx) {
      var q = typeof qSpec === "string" ? { text: qSpec, type: "textarea" } : qSpec || {};
      var qText = q.text || "";
      var wrap = document.createElement("div");
      wrap.className = "solution-card__question";
      if (q.type === "counter" || q.type === "select") {
        wrap.classList.add("solution-card__question--inline");
        var row = document.createElement("div");
        row.className = "solution-card__question-row";
        var labelInline = document.createElement("label");
        labelInline.className = "field__label solution-card__question-label";
        var id = "solution-q-" + uid + "-" + idx;
        labelInline.setAttribute("for", id);
        labelInline.textContent = qText;
        row.appendChild(labelInline);

        if (q.type === "counter") {
          var counter = document.createElement("div");
          counter.className = "counter solution-card__question-counter";
          var dec = document.createElement("button");
          dec.type = "button";
          dec.className = "counter__btn";
          dec.setAttribute("aria-label", "Decrease value");
          dec.textContent = "−";
          var input = document.createElement("input");
          input.id = id;
          input.type = "text";
          input.inputMode = "numeric";
          input.className = "input counter__value js-formatted-number";
          input.autocomplete = "off";
          input.value = formatEnUSNumber(Math.max(0, Math.floor(q.defaultValue || 0)));
          input.setAttribute("aria-label", qText);
          var inc = document.createElement("button");
          inc.type = "button";
          inc.className = "counter__btn";
          inc.setAttribute("aria-label", "Increase value");
          inc.textContent = "+";
          dec.addEventListener("click", function () {
            var v = parseLocaleNumber(input.value);
            if (isNaN(v)) {
              v = 0;
            }
            input.value = formatEnUSNumber(Math.max(0, Math.floor(v) - 1));
          });
          inc.addEventListener("click", function () {
            var v = parseLocaleNumber(input.value);
            if (isNaN(v)) {
              v = 0;
            }
            input.value = formatEnUSNumber(Math.floor(v) + 1);
          });
          attachCommaFormatting(input);
          counter.appendChild(dec);
          counter.appendChild(input);
          counter.appendChild(inc);
          row.appendChild(counter);
        } else {
          var selectWrap = document.createElement("div");
          selectWrap.className = "select-wrap solution-card__question-select-wrap";
          var select = document.createElement("select");
          select.id = id;
          select.className = "select solution-card__question-select";
          (q.options || []).forEach(function (optLabel) {
            var opt = document.createElement("option");
            opt.textContent = String(optLabel || "");
            select.appendChild(opt);
          });
          if (q.defaultValue) {
            for (var oi = 0; oi < select.options.length; oi += 1) {
              if (String(select.options[oi].textContent || "").trim() === String(q.defaultValue)) {
                select.selectedIndex = oi;
                break;
              }
            }
          }
          select.setAttribute("aria-label", qText);
          selectWrap.appendChild(select);
          row.appendChild(selectWrap);
        }
        wrap.appendChild(row);
      } else {
        var lab = document.createElement("label");
        lab.className = "field__label";
        lab.setAttribute("for", "solution-q-" + uid + "-" + idx);
        lab.textContent = "Question " + (idx + 1);
        var ta = document.createElement("textarea");
        ta.id = "solution-q-" + uid + "-" + idx;
        ta.className = "input input--block solution-card__textarea";
        ta.rows = 3;
        ta.setAttribute("aria-label", qText);
        ta.placeholder = qText;
        wrap.appendChild(lab);
        wrap.appendChild(ta);
      }
      container.appendChild(wrap);
    });
  }

  function addSolutionFromTemplate(templateId) {
    var tpl = null;
    for (var i = 0; i < SOLUTION_TEMPLATES.length; i += 1) {
      if (SOLUTION_TEMPLATES[i].id === templateId) {
        tpl = SOLUTION_TEMPLATES[i];
        break;
      }
    }
    if (!tpl) {
      return;
    }
    var tmpl = document.getElementById("solution-card-template");
    var list = document.querySelector(".js-solutions-cards");
    if (!tmpl || !tmpl.content || !list) {
      return;
    }
    solutionCardUid += 1;
    var uid = solutionCardUid;
    var frag = tmpl.content.cloneNode(true);
    var article = frag.querySelector(".solution-card");
    if (!article) {
      return;
    }
    article.dataset.templateId = tpl.id;
    article.dataset.solutionUid = String(uid);

    var nameIn = article.querySelector(".js-solution-custom-name");
    if (nameIn) {
      nameIn.value = tpl.name + " " + (list.querySelectorAll(".solution-card").length + 1);
    }
    var tName = article.querySelector(".js-solution-template-name");
    if (tName) {
      tName.textContent = tpl.name;
    }
    var tDesc = article.querySelector(".js-solution-template-desc");
    if (tDesc) {
      tDesc.textContent = tpl.description;
    }
    var cred = article.querySelector(".js-solution-flex-credits");
    if (cred) {
      if (tpl.isCreateYourOwn) {
        cred.textContent = "—";
      } else {
        cred.textContent = formatEnUSNumber(Math.round(tpl.flexPerYear));
      }
    }

    var qWrap = article.querySelector(".js-solution-questions");
    if (tpl.isCreateYourOwn) {
      applyCreateYourOwnCardLayout(article, tpl, uid);
    } else {
      buildSolutionQuestionFields(qWrap, tpl.questionFields || tpl.questions, uid);
    }
    renderSolutionCapabilitySections(article.querySelector(".js-solution-details-panel"), uid);

    bindSolutionAccordionToggles(article, uid);

    var removeBtn = article.querySelector(".js-solution-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        article.remove();
      });
    }

    list.appendChild(article);
    formatNumericFieldsIn(article);
  }

  function initSolutionsPage() {
    var picker = document.querySelector(".js-solution-template-picker");
    if (!picker) {
      return;
    }
    var menu = picker.querySelector(".js-solution-template-menu");
    var toggle = picker.querySelector(".js-solution-template-toggle");
    if (!menu || !toggle) {
      return;
    }
    renderSolutionTemplateMenu(menu);

    toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = picker.classList.contains("solution-template-picker--open");
      document.querySelectorAll(".solution-template-picker--open").forEach(function (p) {
        if (p !== picker) {
          p.classList.remove("solution-template-picker--open");
          var m = p.querySelector(".js-solution-template-menu");
          var t = p.querySelector(".js-solution-template-toggle");
          if (m) {
            m.hidden = true;
          }
          if (t) {
            t.setAttribute("aria-expanded", "false");
          }
        }
      });
      if (open) {
        closeSolutionTemplateMenu();
      } else {
        picker.classList.add("solution-template-picker--open");
        menu.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
      }
    });

    menu.addEventListener("mousedown", function (ev) {
      ev.stopPropagation();
    });

    document.addEventListener(
      "mousedown",
      function (ev) {
        if (!picker.classList.contains("solution-template-picker--open")) {
          return;
        }
        if (ev.button !== 0) {
          return;
        }
        var t = ev.target;
        if (t && picker.contains(t)) {
          return;
        }
        closeSolutionTemplateMenu();
      },
      true
    );
  }

  if (sourceList) {
    sourceList.addEventListener("input", refreshAllLandscapePicks);
    sourceList.addEventListener("change", refreshAllLandscapePicks);
  }

  if (addSourceBtn) {
    addSourceBtn.addEventListener("click", function () {
      addSourceRow();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (currentStep >= MAX_STEP) {
        nextBtn.disabled = true;
        var t = nextBtn.textContent;
        nextBtn.textContent = "Complete";
        window.setTimeout(function () {
          nextBtn.textContent = t;
          nextBtn.disabled = false;
        }, 900);
        return;
      }
      goToStep(currentStep + 1);
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      goToStep(currentStep - 1);
    });
  }

  formatNumericFieldsIn(document);

  initDataPrep();

  initSolutionsPage();

  var dataPrepStack = document.querySelector(".data-prep-stack");
  if (dataPrepStack) {
    dataPrepStack.addEventListener("input", function () {
      updateLandscapeSummary();
    });
    dataPrepStack.addEventListener("change", function () {
      updateLandscapeSummary();
    });
  }

  var systemGenToggle = document.querySelector(".js-system-gen-details-toggle");
  var systemGenPanel = document.querySelector(".js-system-gen-details-panel");
  if (systemGenToggle && systemGenPanel) {
    systemGenToggle.addEventListener("click", function () {
      var hidden = systemGenPanel.hasAttribute("hidden");
      if (hidden) {
        systemGenPanel.removeAttribute("hidden");
        systemGenToggle.setAttribute("aria-expanded", "true");
      } else {
        systemGenPanel.setAttribute("hidden", "");
        systemGenToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var dataSourcesToggle = document.querySelector(".js-data-sources-details-toggle");
  var dataSourcesPanel = document.querySelector(".js-data-sources-details-panel");
  if (dataSourcesToggle && dataSourcesPanel) {
    dataSourcesToggle.addEventListener("click", function () {
      var hidden = dataSourcesPanel.hasAttribute("hidden");
      if (hidden) {
        dataSourcesPanel.removeAttribute("hidden");
        dataSourcesToggle.setAttribute("aria-expanded", "true");
      } else {
        dataSourcesPanel.setAttribute("hidden", "");
        dataSourcesToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var dataPrepDetailsToggle = document.querySelector(".js-data-prep-details-toggle");
  var dataPrepDetailsPanel = document.querySelector(".js-data-prep-details-panel");
  if (dataPrepDetailsToggle && dataPrepDetailsPanel) {
    dataPrepDetailsToggle.addEventListener("click", function () {
      var hidden = dataPrepDetailsPanel.hasAttribute("hidden");
      if (hidden) {
        dataPrepDetailsPanel.removeAttribute("hidden");
        dataPrepDetailsToggle.setAttribute("aria-expanded", "true");
      } else {
        dataPrepDetailsPanel.setAttribute("hidden", "");
        dataPrepDetailsToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  stepItems.forEach(function (li) {
    var circle = li.querySelector(".steps__circle");
    if (!circle) {
      return;
    }
    var stepNum = parseInt(li.getAttribute("data-wizard-step"), 10);
    if (isNaN(stepNum)) {
      return;
    }
    var labelSpan = li.querySelector(".steps__label");
    var labelText = labelSpan ? String(labelSpan.textContent || "").trim() : "";
    circle.setAttribute("role", "button");
    circle.setAttribute("tabindex", "0");
    circle.setAttribute(
      "aria-label",
      labelText ? "Go to " + labelText + " (step " + stepNum + ")" : "Go to step " + stepNum
    );
    circle.addEventListener("click", function () {
      goToStep(stepNum);
    });
    circle.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        goToStep(stepNum);
      }
    });
  });

  document.querySelectorAll(".js-landscape-pick").forEach(initLandscapePick);

  goToStep(1);
  updateLandscapeSummary();
})();
