/* ---------- 간부임기관리 (Officer Term Management) ---------- */
const OfficerTermManagement = (function () {
    let initialized = false;
    let positions = [];
    let members = [];

    const tbody = () => document.getElementById("officer-term-tbody");
    const modal = () => document.getElementById("officer-term-modal");
    const form = () => document.getElementById("officer-term-form");
    const errorBox = () => document.getElementById("officer-term-error");
    const idField = () => document.getElementById("officer-term-id");
    const positionField = () => document.getElementById("officer-term-position");
    const memberField = () => document.getElementById("officer-term-member");
    const startedField = () => document.getElementById("officer-term-started");
    const endedField = () => document.getElementById("officer-term-ended");

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function renderOptions(select, items, valueKey, labelFn) {
        select.innerHTML = "";
        items.forEach((item) => {
            const option = document.createElement("option");
            option.value = item[valueKey];
            option.textContent = labelFn(item);
            select.appendChild(option);
        });
    }

    async function loadOptions() {
        [positions, members] = await Promise.all([
            fetchJson("/api/positions"),
            fetchJson("/api/members"),
        ]);
        renderOptions(positionField(), positions, "id", (p) => p.name);
        renderOptions(memberField(), members, "id", (m) =>
            m.active ? m.name + " (" + m.baptismalName + ")" : m.name + " (비활성)"
        );
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function renderRows(terms) {
        const body = tbody();
        body.innerHTML = "";

        if (!terms.length) {
            body.innerHTML =
                '<tr><td colspan="5" class="table-empty">등록된 간부임기가 없습니다.</td></tr>';
            return;
        }

        terms.forEach((term) => {
            const tr = document.createElement("tr");

            const endedCell = term.endedOn
                ? term.endedOn
                : '<span class="badge-active-term">현재</span>';

            tr.innerHTML =
                "<td><span class=\"member-position-badge\">" + escapeHtml(term.positionName) + "</span></td>" +
                "<td>" + escapeHtml(term.memberName) + " (" + escapeHtml(term.memberBaptismalName) + ")</td>" +
                "<td>" + escapeHtml(term.startedOn) + "</td>" +
                "<td>" + endedCell + "</td>" +
                '<td class="col-actions">' +
                '<button type="button" class="btn-icon edit" data-id="' + term.id + '">수정</button>' +
                '<button type="button" class="btn-icon delete" data-id="' + term.id + '">삭제</button>' +
                "</td>";

            body.appendChild(tr);
        });

        body.querySelectorAll(".btn-icon.edit").forEach((btn) => {
            btn.addEventListener("click", () => openEditModal(Number(btn.dataset.id), terms));
        });
        body.querySelectorAll(".btn-icon.delete").forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
        });
    }

    async function loadTerms() {
        tbody().innerHTML =
            '<tr><td colspan="5" class="table-empty">불러오는 중...</td></tr>';
        try {
            const terms = await fetchJson("/api/officer-terms");
            renderRows(terms);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="5" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    function openCreateModal() {
        document.getElementById("officer-term-modal-title").textContent = "간부임기 등록";
        idField().value = "";
        form().reset();
        if (positions[0]) positionField().value = positions[0].id;
        if (members[0]) memberField().value = members[0].id;
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function openEditModal(id, terms) {
        const term = terms.find((t) => t.id === id);
        if (!term) return;
        document.getElementById("officer-term-modal-title").textContent = "간부임기 수정";
        idField().value = term.id;
        positionField().value = term.positionId;
        memberField().value = term.memberId;
        startedField().value = term.startedOn;
        endedField().value = term.endedOn || "";
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function closeModal() {
        modal().classList.remove("is-active");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorBox().textContent = "";

        const payload = {
            positionId: Number(positionField().value),
            memberId: Number(memberField().value),
            startedOn: startedField().value,
            endedOn: endedField().value || null,
        };

        const id = idField().value;
        const url = id ? "/api/officer-terms/" + id : "/api/officer-terms";
        const method = id ? "PUT" : "POST";

        try {
            await fetchJson(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            closeModal();
            await loadTerms();
        } catch (err) {
            errorBox().textContent = err.message;
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("해당 간부임기를 삭제하시겠습니까?")) return;
        try {
            await fetchJson("/api/officer-terms/" + id, { method: "DELETE" });
            await loadTerms();
        } catch (err) {
            window.alert(err.message);
        }
    }

    function bindStaticEvents() {
        document.getElementById("officer-term-add-btn").addEventListener("click", openCreateModal);
        document.getElementById("officer-term-cancel").addEventListener("click", closeModal);
        modal().addEventListener("click", (event) => {
            if (event.target === modal()) closeModal();
        });
        form().addEventListener("submit", handleSubmit);
    }

    return {
        async init() {
            if (initialized) return;
            initialized = true;
            bindStaticEvents();
            await loadOptions();
            await loadTerms();
        },
    };
})();

/* ---------- 주회합관리 (Meeting Management) ---------- */
const MeetingManagement = (function () {
    let initialized = false;

    const tbody = () => document.getElementById("meeting-tbody");
    const modal = () => document.getElementById("meeting-modal");
    const form = () => document.getElementById("meeting-form");
    const errorBox = () => document.getElementById("meeting-error");
    const idField = () => document.getElementById("meeting-id");
    const sequenceField = () => document.getElementById("meeting-sequence");
    const dateField = () => document.getElementById("meeting-date");
    const timeField = () => document.getElementById("meeting-time");
    const placeField = () => document.getElementById("meeting-place");
    const notesField = () => document.getElementById("meeting-notes");

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function renderRows(meetings) {
        const body = tbody();
        body.innerHTML = "";

        if (!meetings.length) {
            body.innerHTML =
                '<tr><td colspan="6" class="table-empty">등록된 회차가 없습니다.</td></tr>';
            return;
        }

        meetings.forEach((meeting) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + (meeting.sequence != null ? escapeHtml(meeting.sequence) + "회차" : "-") + "</td>" +
                "<td>" + escapeHtml(meeting.meetingDate) + "</td>" +
                "<td>" + escapeHtml(meeting.dayOfWeek) + "</td>" +
                "<td>" + (meeting.startTime ? escapeHtml(meeting.startTime) : "-") + "</td>" +
                "<td>" + (meeting.place ? escapeHtml(meeting.place) : "-") + "</td>" +
                '<td class="col-actions">' +
                '<button type="button" class="btn-icon edit" data-id="' + meeting.id + '">수정</button>' +
                '<button type="button" class="btn-icon delete" data-id="' + meeting.id + '">삭제</button>' +
                "</td>";
            body.appendChild(tr);
        });

        body.querySelectorAll(".btn-icon.edit").forEach((btn) => {
            btn.addEventListener("click", () => openEditModal(Number(btn.dataset.id), meetings));
        });
        body.querySelectorAll(".btn-icon.delete").forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
        });
    }

    async function loadMeetings() {
        tbody().innerHTML =
            '<tr><td colspan="6" class="table-empty">불러오는 중...</td></tr>';
        try {
            const meetings = await fetchJson("/api/meeting-management");
            renderRows(meetings);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="6" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    function openCreateModal() {
        document.getElementById("meeting-modal-title").textContent = "주회합 등록";
        idField().value = "";
        form().reset();
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function openEditModal(id, meetings) {
        const meeting = meetings.find((m) => m.id === id);
        if (!meeting) return;
        document.getElementById("meeting-modal-title").textContent = "주회합 수정";
        idField().value = meeting.id;
        sequenceField().value = meeting.sequence != null ? meeting.sequence : "";
        dateField().value = meeting.meetingDate;
        timeField().value = meeting.startTime || "";
        placeField().value = meeting.place || "";
        notesField().value = meeting.notes || "";
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function closeModal() {
        modal().classList.remove("is-active");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorBox().textContent = "";

        const payload = {
            meetingDate: dateField().value,
            startTime: timeField().value || null,
            place: placeField().value || null,
            sequence: sequenceField().value ? Number(sequenceField().value) : null,
            notes: notesField().value || "",
        };

        const id = idField().value;
        const url = id ? "/api/meeting-management/" + id : "/api/meeting-management";
        const method = id ? "PUT" : "POST";

        try {
            await fetchJson(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            closeModal();
            await loadMeetings();
        } catch (err) {
            errorBox().textContent = err.message;
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("해당 주회합(회차)을 삭제하시겠습니까?")) return;
        try {
            await fetchJson("/api/meeting-management/" + id, { method: "DELETE" });
            await loadMeetings();
        } catch (err) {
            window.alert(err.message);
        }
    }

    function bindStaticEvents() {
        document.getElementById("meeting-add-btn").addEventListener("click", openCreateModal);
        document.getElementById("meeting-cancel").addEventListener("click", closeModal);
        modal().addEventListener("click", (event) => {
            if (event.target === modal()) closeModal();
        });
        form().addEventListener("submit", handleSubmit);
    }

    return {
        async init() {
            if (initialized) return;
            initialized = true;
            bindStaticEvents();
            await loadMeetings();
        },
    };
})();

/* ---------- 주요일정 관리 (Schedule Event Management) ---------- */
const ScheduleEventManagement = (function () {
    let initialized = false;

    const tbody = () => document.getElementById("schedule-event-tbody");
    const modal = () => document.getElementById("schedule-event-modal");
    const form = () => document.getElementById("schedule-event-form");
    const errorBox = () => document.getElementById("schedule-event-error");
    const idField = () => document.getElementById("schedule-event-id");
    const dateField = () => document.getElementById("schedule-event-date");
    const titleField = () => document.getElementById("schedule-event-title");
    const detailField = () => document.getElementById("schedule-event-detail");

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function renderRows(events) {
        const body = tbody();
        body.innerHTML = "";

        if (!events.length) {
            body.innerHTML =
                '<tr><td colspan="4" class="table-empty">등록된 일정이 없습니다.</td></tr>';
            return;
        }

        events.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + escapeHtml(item.eventDate) + "</td>" +
                "<td>" + escapeHtml(item.title) + "</td>" +
                "<td>" + (item.detail ? escapeHtml(item.detail) : "-") + "</td>" +
                '<td class="col-actions">' +
                '<button type="button" class="btn-icon edit" data-id="' + item.id + '">수정</button>' +
                '<button type="button" class="btn-icon delete" data-id="' + item.id + '">삭제</button>' +
                "</td>";
            body.appendChild(tr);
        });

        body.querySelectorAll(".btn-icon.edit").forEach((btn) => {
            btn.addEventListener("click", () => openEditModal(Number(btn.dataset.id), events));
        });
        body.querySelectorAll(".btn-icon.delete").forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
        });
    }

    async function loadEvents() {
        tbody().innerHTML = '<tr><td colspan="4" class="table-empty">불러오는 중...</td></tr>';
        try {
            const events = await fetchJson("/api/schedule-events");
            renderRows(events);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="4" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    function openCreateModal() {
        document.getElementById("schedule-event-modal-title").textContent = "일정 등록";
        idField().value = "";
        form().reset();
        const selected = MainScheduleCalendar.getSelectedDate();
        if (selected) dateField().value = selected;
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function openEditModal(id, events) {
        const item = events.find((e) => e.id === id);
        if (!item) return;
        document.getElementById("schedule-event-modal-title").textContent = "일정 수정";
        idField().value = item.id;
        dateField().value = item.eventDate;
        titleField().value = item.title;
        detailField().value = item.detail || "";
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function closeModal() {
        modal().classList.remove("is-active");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorBox().textContent = "";

        const payload = {
            eventDate: dateField().value,
            title: titleField().value || "",
            detail: detailField().value || null,
        };

        const id = idField().value;
        const url = id ? "/api/schedule-events/" + id : "/api/schedule-events";
        const method = id ? "PUT" : "POST";

        try {
            await fetchJson(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            closeModal();
            await loadEvents();
            MainScheduleCalendar.reload();
        } catch (err) {
            errorBox().textContent = err.message;
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("해당 일정을 삭제하시겠습니까?")) return;
        try {
            await fetchJson("/api/schedule-events/" + id, { method: "DELETE" });
            await loadEvents();
            MainScheduleCalendar.reload();
        } catch (err) {
            window.alert(err.message);
        }
    }

    function bindStaticEvents() {
        document.getElementById("schedule-add-btn").addEventListener("click", openCreateModal);
        document.getElementById("schedule-event-cancel").addEventListener("click", closeModal);
        modal().addEventListener("click", (event) => {
            if (event.target === modal()) closeModal();
        });
        form().addEventListener("submit", handleSubmit);
    }

    return {
        async init() {
            if (initialized) return;
            initialized = true;
            bindStaticEvents();
            await loadEvents();
        },
    };
})();

/* ---------- 출석 (Attendance) ---------- */
const AttendanceManagement = (function () {
    const tbody = () => document.getElementById("attendance-tbody");

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function getMeetingId() {
        const sessionSelect = document.getElementById("session-select");
        return sessionSelect ? sessionSelect.value : "";
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function renderRows(members) {
        const body = tbody();
        body.innerHTML = "";

        if (!members.length) {
            body.innerHTML =
                '<tr><td colspan="2" class="table-empty">등록된 단원이 없습니다.</td></tr>';
            return;
        }

        members.forEach((member) => {
            const tr = document.createElement("tr");
            const positionPrefix = member.positionName
                ? '<span class="member-position-badge">' + escapeHtml(member.positionName) + "</span> "
                : "";
            tr.innerHTML =
                "<td>" + positionPrefix + escapeHtml(member.memberName) + " (" + escapeHtml(member.memberBaptismalName) + ")</td>" +
                '<td class="col-center">' +
                '<input type="checkbox" class="attendance-checkbox" data-member-id="' + member.memberId + '"' +
                (member.present ? " checked" : "") +
                " /></td>";
            body.appendChild(tr);
        });

        body.querySelectorAll(".attendance-checkbox").forEach((checkbox) => {
            checkbox.addEventListener("change", (event) => handleToggle(event.target));
        });
    }

    async function handleToggle(checkbox) {
        const meetingId = getMeetingId();
        if (!meetingId) return;

        const memberId = Number(checkbox.dataset.memberId);
        const present = checkbox.checked;
        checkbox.disabled = true;

        try {
            await fetchJson("/api/meetings/" + meetingId + "/attendance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, present }),
            });
        } catch (err) {
            checkbox.checked = !present;
            window.alert(err.message);
        } finally {
            checkbox.disabled = false;
        }
    }

    async function load() {
        const meetingId = getMeetingId();
        if (!meetingId) {
            tbody().innerHTML =
                '<tr><td colspan="2" class="table-empty">선택된 회차가 없습니다.</td></tr>';
            return;
        }

        tbody().innerHTML =
            '<tr><td colspan="2" class="table-empty">불러오는 중...</td></tr>';
        try {
            const members = await fetchJson("/api/meetings/" + meetingId + "/attendance");
            renderRows(members);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="2" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    return { load };
})();

/* ---------- 회계 (Accounting) ---------- */
const AccountingManagement = (function () {
    let currentItems = [];

    const tbody = () => document.getElementById("finance-tbody");
    const balanceCell = () => document.getElementById("finance-balance");
    const modal = () => document.getElementById("finance-modal");
    const form = () => document.getElementById("finance-form");
    const errorBox = () => document.getElementById("finance-error");
    const idField = () => document.getElementById("finance-id");
    const kindField = () => document.getElementById("finance-kind");
    const descriptionField = () => document.getElementById("finance-description");
    const amountField = () => document.getElementById("finance-amount");

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function formatAmount(amount) {
        return Number(amount).toLocaleString("ko-KR") + "원";
    }

    function getMeetingId() {
        const sessionSelect = document.getElementById("session-select");
        return sessionSelect ? sessionSelect.value : "";
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function renderSummary(summary) {
        currentItems = summary.items;
        const body = tbody();
        body.innerHTML = "";

        if (!summary.items.length) {
            body.innerHTML =
                '<tr><td colspan="4" class="table-empty">등록된 회계항목이 없습니다.</td></tr>';
        } else {
            summary.items.forEach((item) => {
                const tr = document.createElement("tr");
                tr.dataset.id = item.id;
                const kindSelect =
                    '<select class="finance-inline-select finance-field-kind" data-id="' + item.id + '">' +
                    '<option value="INCOME"' + (item.kind === "INCOME" ? " selected" : "") + ">수입</option>" +
                    '<option value="EXPENSE"' + (item.kind === "EXPENSE" ? " selected" : "") + ">지출</option>" +
                    "</select>";
                const descriptionInput =
                    '<input type="text" class="finance-inline-input finance-field-description" data-id="' +
                    item.id + '" value="' + escapeHtml(item.description) + '" />';
                const amountInput =
                    '<input type="number" step="1" class="finance-inline-input finance-field-amount" data-id="' +
                    item.id + '" value="' + item.amount + '" />';
                const actions =
                    '<button type="button" class="btn-icon delete" data-id="' + item.id + '">삭제</button>';
                tr.innerHTML =
                    "<td>" + kindSelect + "</td>" +
                    "<td>" + descriptionInput + "</td>" +
                    '<td class="col-right">' + amountInput + "</td>" +
                    '<td class="col-actions">' + actions + "</td>";
                body.appendChild(tr);
            });
        }

        balanceCell().textContent = formatAmount(summary.balance);

        body.querySelectorAll(".finance-field-kind, .finance-field-description, .finance-field-amount").forEach(
            (field) => {
                field.addEventListener("change", () => handleInlineSave(Number(field.dataset.id)));
            }
        );
        body.querySelectorAll(".btn-icon.delete").forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
        });
    }

    async function load() {
        const meetingId = getMeetingId();
        if (!meetingId) {
            tbody().innerHTML =
                '<tr><td colspan="4" class="table-empty">선택된 회차가 없습니다.</td></tr>';
            balanceCell().textContent = "-";
            return;
        }

        tbody().innerHTML =
            '<tr><td colspan="4" class="table-empty">불러오는 중...</td></tr>';
        try {
            const summary = await fetchJson("/api/meetings/" + meetingId + "/finance");
            renderSummary(summary);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="4" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    function openCreateModal() {
        document.getElementById("finance-modal-title").textContent = "회계항목 등록";
        idField().value = "";
        form().reset();
        kindField().value = "EXPENSE";
        kindField().disabled = false;
        descriptionField().disabled = false;
        errorBox().textContent = "";
        modal().classList.add("is-active");
    }

    function closeModal() {
        modal().classList.remove("is-active");
    }

    async function handleInlineSave(id) {
        const meetingId = getMeetingId();
        if (!meetingId) return;

        const row = tbody().querySelector('tr[data-id="' + id + '"]');
        if (!row) return;

        const kindEl = row.querySelector(".finance-field-kind");
        const descriptionEl = row.querySelector(".finance-field-description");
        const amountEl = row.querySelector(".finance-field-amount");

        const payload = {
            kind: kindEl.value,
            description: descriptionEl.value,
            amount: Number(amountEl.value),
        };

        try {
            const summary = await fetchJson("/api/meetings/" + meetingId + "/finance/" + id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            renderSummary(summary);
        } catch (err) {
            window.alert(err.message);
            load();
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorBox().textContent = "";

        const meetingId = getMeetingId();
        if (!meetingId) return;

        const payload = {
            kind: kindField().value,
            description: descriptionField().value,
            amount: Number(amountField().value),
        };

        try {
            const summary = await fetchJson("/api/meetings/" + meetingId + "/finance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            closeModal();
            renderSummary(summary);
        } catch (err) {
            errorBox().textContent = err.message;
        }
    }

    async function handleDelete(id) {
        const meetingId = getMeetingId();
        if (!meetingId) return;
        if (!window.confirm("해당 회계항목을 삭제하시겠습니까?")) return;
        try {
            const summary = await fetchJson("/api/meetings/" + meetingId + "/finance/" + id, {
                method: "DELETE",
            });
            renderSummary(summary);
        } catch (err) {
            window.alert(err.message);
        }
    }

    let bound = false;
    function bindStaticEvents() {
        if (bound) return;
        bound = true;
        document.getElementById("finance-add-btn").addEventListener("click", openCreateModal);
        document.getElementById("finance-cancel").addEventListener("click", closeModal);
        modal().addEventListener("click", (event) => {
            if (event.target === modal()) closeModal();
        });
        form().addEventListener("submit", handleSubmit);
    }

    return {
        load() {
            bindStaticEvents();
            load();
        },
    };
})();

/* ---------- 주요일정 (Main Schedule Calendar) ---------- */
const MainScheduleCalendar = (function () {
    let current = new Date();
    let eventsByDate = {};
    let selectedDate = null;

    const titleEl = () => document.getElementById("calendar-title");
    const daysEl = () => document.getElementById("calendar-days");
    const selectedDateEl = () => document.getElementById("calendar-selected-date");
    const selectedEventsEl = () => document.getElementById("calendar-selected-events");

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("일정 데이터를 불러오지 못했습니다.");
        }
        return response.json();
    }

    function pad2(n) {
        return String(n).padStart(2, "0");
    }

    function formatDate(year, month, day) {
        return year + "-" + pad2(month) + "-" + pad2(day);
    }

    function todayStr() {
        const t = new Date();
        return formatDate(t.getFullYear(), t.getMonth() + 1, t.getDate());
    }

    const EVENT_CLASS = {
        FEAST_DAY: "event-feast",
        MEMBER_FEAST: "event-member",
        MEETING: "event-meeting",
        SCHEDULE: "event-schedule",
    };

    const EVENT_DOT_COLOR = {
        FEAST_DAY: "#9aa3b5",
        MEMBER_FEAST: "#3a7afe",
        MEETING: "#2fb380",
        SCHEDULE: "#e08a2f",
    };

    function renderSelectedDay() {
        if (!selectedDateEl() || !selectedEventsEl()) return;

        if (!selectedDate) {
            selectedDateEl().textContent = "날짜를 선택하면 해당 일정이 여기에 표시됩니다.";
            selectedEventsEl().innerHTML = "";
            return;
        }

        selectedDateEl().textContent = selectedDate + " 일정";
        const dayEvents = eventsByDate[selectedDate] || [];

        if (dayEvents.length === 0) {
            selectedEventsEl().innerHTML = '<li class="table-empty-inline">등록된 일정이 없습니다.</li>';
            return;
        }

        selectedEventsEl().innerHTML = dayEvents
            .map((event) => {
                const dot = EVENT_DOT_COLOR[event.type] || "#9aa3b5";
                const detail = event.detail
                    ? '<span class="event-detail">' + escapeHtml(event.detail) + "</span>"
                    : "";
                return (
                    '<li><span class="event-dot" style="background-color:' +
                    dot +
                    ';"></span><span>' +
                    escapeHtml(event.title) +
                    "</span>" +
                    detail +
                    "</li>"
                );
            })
            .join("");
    }

    function renderCalendar() {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;

        if (titleEl()) titleEl().textContent = year + "년 " + month + "월";

        const firstDay = new Date(year, month - 1, 1);
        const startWeekday = firstDay.getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const today = todayStr();

        const cells = [];
        for (let i = 0; i < startWeekday; i++) {
            cells.push('<div class="calendar-day-cell is-empty"></div>');
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(year, month, day);
            const dayEvents = eventsByDate[dateStr] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            let eventsHtml = "";
            dayEvents.forEach((event) => {
                const cls = EVENT_CLASS[event.type] || "event-feast";
                const label = escapeHtml(event.title);
                const titleAttr = event.detail ? escapeHtml(event.detail) : label;
                eventsHtml +=
                    '<div class="calendar-event ' + cls + '" title="' + titleAttr + '">' + label + "</div>";
            });

            const classes =
                "calendar-day-cell" + (isToday ? " is-today" : "") + (isSelected ? " is-selected" : "");
            cells.push(
                '<div class="' + classes + '" data-date="' + dateStr + '">' +
                    '<div class="calendar-day-number">' + day + "</div>" +
                    eventsHtml +
                    "</div>"
            );
        }

        daysEl().innerHTML = cells.join("");

        daysEl().querySelectorAll(".calendar-day-cell[data-date]").forEach((cell) => {
            cell.addEventListener("click", () => {
                selectedDate = cell.dataset.date;
                renderCalendar();
                renderSelectedDay();
            });
        });

        renderSelectedDay();
    }

    async function loadMonth() {
        const year = current.getFullYear();
        const month = current.getMonth() + 1;

        daysEl().innerHTML = '<div class="calendar-day-cell is-empty">불러오는 중...</div>';
        try {
            const events = await fetchJson("/api/calendar?year=" + year + "&month=" + month);
            eventsByDate = {};
            events.forEach((event) => {
                if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
                eventsByDate[event.date].push(event);
            });
            renderCalendar();
        } catch (err) {
            daysEl().innerHTML = '<div class="calendar-day-cell is-empty">' + escapeHtml(err.message) + "</div>";
        }
    }

    function bindEvents() {
        document.getElementById("calendar-prev").addEventListener("click", () => {
            current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
            selectedDate = null;
            loadMonth();
        });
        document.getElementById("calendar-next").addEventListener("click", () => {
            current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            selectedDate = null;
            loadMonth();
        });
        document.getElementById("calendar-today").addEventListener("click", () => {
            current = new Date();
            selectedDate = null;
            loadMonth();
        });
    }

    let initialized = false;

    return {
        init() {
            if (initialized) return;
            initialized = true;
            bindEvents();
            loadMonth();
        },
        reload() {
            loadMonth();
        },
        getSelectedDate() {
            return selectedDate;
        },
    };
})();

/* ---------- 단원관리 (Member Management) ---------- */
const MemberManagement = (function () {
    let initialized = false;

    const tbody = () => document.getElementById("member-tbody");
    const modal = () => document.getElementById("member-modal");
    const form = () => document.getElementById("member-form");
    const errorBox = () => document.getElementById("member-error");
    const idField = () => document.getElementById("member-id");
    const nameField = () => document.getElementById("member-name");
    const baptismalField = () => document.getElementById("member-baptismal-name");
    const phoneField = () => document.getElementById("member-phone");
    const addressField = () => document.getElementById("member-address");
    const joinedField = () => document.getElementById("member-joined-on");
    const leftField = () => document.getElementById("member-left-on");
    const activeField = () => document.getElementById("member-active");
    const photoField = () => document.getElementById("member-photo");
    const modalTitle = () => document.getElementById("member-modal-title");

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error((body && body.message) || "요청을 처리하지 못했습니다. (" + response.status + ")");
        }
        if (response.status === 204) return null;
        return response.json();
    }

    function renderRows(members) {
        if (!members.length) {
            tbody().innerHTML = '<tr><td colspan="10" class="table-empty">등록된 단원이 없습니다.</td></tr>';
            return;
        }

        tbody().innerHTML = members
            .map((member) => {
                const photoCell = member.hasPhoto
                    ? '<img class="member-photo-thumb" src="/api/member-management/' +
                      member.id +
                      '/photo" alt="사진" />'
                    : '<div class="member-photo-placeholder">사진없음</div>';
                const positionLabel = member.positionName
                    ? '<span class="member-position-badge">' + escapeHtml(member.positionName) + "</span>"
                    : '<span class="member-position-badge member-position-badge-plain">단원</span>';
                return (
                    "<tr>" +
                    "<td>" + photoCell + "</td>" +
                    "<td>" + positionLabel + "</td>" +
                    "<td>" + escapeHtml(member.name) + "</td>" +
                    "<td>" + escapeHtml(member.baptismalName) + "</td>" +
                    "<td>" + escapeHtml(member.phone) + "</td>" +
                    "<td>" + escapeHtml(member.address) + "</td>" +
                    "<td>" + escapeHtml(member.joinedOn || "-") + "</td>" +
                    "<td>" + escapeHtml(member.leftOn || "-") + "</td>" +
                    '<td class="col-center">' + (member.active ? "활동" : "비활동") + "</td>" +
                    '<td class="col-actions">' +
                    '<button type="button" class="btn-icon edit" data-action="edit" data-id="' + member.id + '">수정</button>' +
                    '<button type="button" class="btn-icon delete" data-action="delete" data-id="' + member.id + '">삭제</button>' +
                    "</td>" +
                    "</tr>"
                );
            })
            .join("");

        tbody().querySelectorAll('button[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => openEditModal(parseInt(btn.dataset.id, 10), members));
        });
        tbody().querySelectorAll('button[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(parseInt(btn.dataset.id, 10)));
        });
    }

    let cachedMembers = [];

    async function load() {
        tbody().innerHTML = '<tr><td colspan="10" class="table-empty">불러오는 중...</td></tr>';
        try {
            cachedMembers = await fetchJson("/api/member-management");
            renderRows(cachedMembers);
        } catch (err) {
            tbody().innerHTML = '<tr><td colspan="10" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    function resetForm() {
        form().reset();
        idField().value = "";
        activeField().checked = true;
        errorBox().textContent = "";
    }

    function openCreateModal() {
        resetForm();
        modalTitle().textContent = "단원 등록";
        modal().classList.add("is-active");
    }

    function openEditModal(id, members) {
        const member = members.find((m) => m.id === id);
        if (!member) return;
        resetForm();
        modalTitle().textContent = "단원 수정";
        idField().value = member.id;
        nameField().value = member.name;
        baptismalField().value = member.baptismalName;
        phoneField().value = member.phone || "";
        addressField().value = member.address || "";
        joinedField().value = member.joinedOn || "";
        leftField().value = member.leftOn || "";
        activeField().checked = !!member.active;
        modal().classList.add("is-active");
    }

    function closeModal() {
        modal().classList.remove("is-active");
    }

    async function handleDelete(id) {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await fetchJson("/api/member-management/" + id, { method: "DELETE" });
            await load();
        } catch (err) {
            window.alert(err.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorBox().textContent = "";

        const formData = new FormData();
        formData.append("name", nameField().value.trim());
        formData.append("baptismalName", baptismalField().value.trim());
        formData.append("phone", phoneField().value.trim());
        formData.append("address", addressField().value.trim());
        formData.append("active", activeField().checked ? "true" : "false");
        if (joinedField().value) formData.append("joinedOn", joinedField().value);
        if (leftField().value) formData.append("leftOn", leftField().value);
        if (photoField().files && photoField().files[0]) {
            formData.append("photo", photoField().files[0]);
        }

        const id = idField().value;
        const url = id ? "/api/member-management/" + id : "/api/member-management";
        const method = id ? "PUT" : "POST";

        try {
            await fetchJson(url, { method, body: formData });
            closeModal();
            await load();
        } catch (err) {
            errorBox().textContent = err.message;
        }
    }

    function bindEvents() {
        document.getElementById("member-add-btn").addEventListener("click", openCreateModal);
        document.getElementById("member-cancel").addEventListener("click", closeModal);
        form().addEventListener("submit", handleSubmit);
        modal().addEventListener("click", (event) => {
            if (event.target === modal()) closeModal();
        });
    }

    return {
        init() {
            if (!initialized) {
                initialized = true;
                bindEvents();
            }
            load();
        },
    };
})();

/* ---------- 활동항목관리 (Activity Item Management) ---------- */
const ActivityItemManagement = (function () {
    const tbody = () => document.getElementById("activity-item-tbody");

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("활동항목 데이터를 불러오지 못했습니다.");
        }
        return response.json();
    }

    function render(items) {
        const body = tbody();
        body.innerHTML = "";

        if (!items.length) {
            body.innerHTML =
                '<tr><td colspan="4" class="table-empty">등록된 활동항목이 없습니다.</td></tr>';
            return;
        }

        items.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + escapeHtml(item.categoryName) + "</td>" +
                "<td>" + escapeHtml(item.name) + "</td>" +
                "<td>" + escapeHtml(item.shortName) + "</td>" +
                "<td>" + escapeHtml(item.unit) + "</td>";
            body.appendChild(tr);
        });
    }

    async function load() {
        tbody().innerHTML =
            '<tr><td colspan="4" class="table-empty">불러오는 중...</td></tr>';
        try {
            const items = await fetchJson("/api/activity-items");
            render(items);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="4" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    return {
        init() {
            load();
        },
    };
})();

/* ---------- 활동 (Activity Counts) ---------- */
const ActivityManagement = (function () {
    const DOCUMENT_ORDER_NAMES = [
        "오근종", "김형삼", "유순준", "송상훈", "신용", "이용택", "임재덕", "강태경", "정일운",
    ];

    const headerRow = () => document.getElementById("activity-count-header");
    const tbody = () => document.getElementById("activity-count-tbody");
    const subtotalRow = () => document.getElementById("activity-count-subtotal-row");
    const sortToggle = () => document.getElementById("activity-sort-toggle");

    let sortMode = "default";
    let lastColumns = [];
    let lastMembers = [];

    function sortedMembers() {
        if (sortMode !== "document") return lastMembers;
        const indexed = lastMembers.map((member, index) => ({ member, index }));
        indexed.sort((a, b) => {
            const aIdx = DOCUMENT_ORDER_NAMES.indexOf(a.member.memberName);
            const bIdx = DOCUMENT_ORDER_NAMES.indexOf(b.member.memberName);
            const aRank = aIdx === -1 ? DOCUMENT_ORDER_NAMES.length + a.index : aIdx;
            const bRank = bIdx === -1 ? DOCUMENT_ORDER_NAMES.length + b.index : bIdx;
            return aRank - bRank;
        });
        return indexed.map((entry) => entry.member);
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function getMeetingId() {
        const sessionSelect = document.getElementById("session-select");
        return sessionSelect ? sessionSelect.value : "";
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function renderHeader(columns) {
        const row = headerRow();
        row.innerHTML = "<th>직책</th><th>이름</th>";
        columns.forEach((col) => {
            const th = document.createElement("th");
            th.className = "col-center";
            th.textContent = col.shortName || col.name;
            row.appendChild(th);
        });
    }

    function renderSubtotal(columns) {
        const row = subtotalRow();
        row.innerHTML = '<td colspan="2">소계</td>';
        columns.forEach((col) => {
            const td = document.createElement("td");
            td.className = "col-center";
            td.id = "activity-subtotal-" + col.activityTypeId;
            td.textContent = "0";
            row.appendChild(td);
        });
    }

    function recalcSubtotal(columns) {
        columns.forEach((col) => {
            let sum = 0;
            tbody()
                .querySelectorAll('.activity-count-input[data-activity-type-id="' + col.activityTypeId + '"]')
                .forEach((input) => {
                    const value = Number(input.value);
                    if (Number.isFinite(value)) sum += value;
                });
            const cell = document.getElementById("activity-subtotal-" + col.activityTypeId);
            if (cell) cell.textContent = String(sum);
        });
    }

    function renderRows(columns, members) {
        const body = tbody();
        body.innerHTML = "";

        if (!members.length) {
            body.innerHTML =
                '<tr><td colspan="' + (columns.length + 2) + '" class="table-empty">등록된 단원이 없습니다.</td></tr>';
            return;
        }

        members.forEach((member) => {
            const tr = document.createElement("tr");
            const positionCell = member.positionName
                ? '<span class="member-position-badge">' + escapeHtml(member.positionName) + "</span>"
                : "";
            let cells =
                "<td>" + positionCell + "</td>" +
                "<td>" + escapeHtml(member.memberName) +
                '<div class="member-baptismal-sub">' + escapeHtml(member.memberBaptismalName) + "</div></td>";

            member.counts.forEach((cell) => {
                const countClass = cell.count > 0 ? " has-count" : "";
                cells +=
                    '<td class="col-center">' +
                    '<input type="number" min="0" step="1" class="finance-inline-input activity-count-input' + countClass + '" ' +
                    'data-member-id="' + member.memberId + '" data-activity-type-id="' + cell.activityTypeId + '" ' +
                    'value="' + cell.count + '" /></td>';
            });

            tr.innerHTML = cells;
            body.appendChild(tr);
        });

        body.querySelectorAll(".activity-count-input").forEach((input) => {
            input.addEventListener("change", () => handleChange(input));
        });
    }

    async function handleChange(input) {
        const meetingId = getMeetingId();
        if (!meetingId) return;

        const memberId = Number(input.dataset.memberId);
        const activityTypeId = Number(input.dataset.activityTypeId);
        const previousValue = input.dataset.lastValue || "0";
        const count = Number(input.value);

        if (!Number.isFinite(count) || count < 0) {
            window.alert("0 이상의 숫자를 입력해주세요.");
            input.value = previousValue;
            return;
        }

        input.disabled = true;
        try {
            await fetchJson("/api/meetings/" + meetingId + "/activity-counts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, activityTypeId, count }),
            });
            input.dataset.lastValue = String(count);
            input.classList.toggle("has-count", count > 0);
            recalcSubtotal(lastColumns);
        } catch (err) {
            input.value = previousValue;
            window.alert(err.message);
        } finally {
            input.disabled = false;
        }
    }

    async function load() {
        const meetingId = getMeetingId();
        if (!meetingId) {
            tbody().innerHTML =
                '<tr><td colspan="2" class="table-empty">선택된 회차가 없습니다.</td></tr>';
            return;
        }

        tbody().innerHTML =
            '<tr><td colspan="2" class="table-empty">불러오는 중...</td></tr>';
        try {
            const grid = await fetchJson("/api/meetings/" + meetingId + "/activity-counts");
            lastColumns = grid.columns;
            lastMembers = grid.members;
            renderHeader(lastColumns);
            renderSubtotal(lastColumns);
            renderRows(lastColumns, sortedMembers());
            tbody().querySelectorAll(".activity-count-input").forEach((input) => {
                input.dataset.lastValue = input.value;
            });
            recalcSubtotal(lastColumns);
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="2" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    const toggle = sortToggle();
    if (toggle) {
        toggle.addEventListener("change", () => {
            sortMode = toggle.checked ? "document" : "default";
            renderHeader(lastColumns);
            renderRows(lastColumns, sortedMembers());
            tbody().querySelectorAll(".activity-count-input").forEach((input) => {
                input.dataset.lastValue = input.value;
            });
        });
    }

    return { load };
})();

/* ---------- 활동사항 등록 (Activity Register) ---------- */
const ActivityRegisterManagement = (function () {
    let initialized = false;
    let activityItems = [];
    let members = [];
    let lastExtraItems = [];

    const form = () => document.getElementById("activity-register-form");
    const errorBox = () => document.getElementById("activity-register-error");
    const memberField = () => document.getElementById("activity-register-member");
    const categoryField = () => document.getElementById("activity-register-category");
    const itemField = () => document.getElementById("activity-register-item");
    const countField = () => document.getElementById("activity-register-count");
    const extraTbody = () => document.getElementById("activity-extra-tbody");

    const extraModal = () => document.getElementById("activity-extra-modal");
    const extraForm = () => document.getElementById("activity-extra-form");
    const extraErrorBox = () => document.getElementById("activity-extra-error");
    const extraIdField = () => document.getElementById("activity-extra-id");
    const extraMemberField = () => document.getElementById("activity-extra-member");
    const extraCategoryField = () => document.getElementById("activity-extra-category");
    const extraItemField = () => document.getElementById("activity-extra-item");
    const extraCountField = () => document.getElementById("activity-extra-count");

    function getMeetingId() {
        const sessionSelect = document.getElementById("session-select");
        return sessionSelect ? sessionSelect.value : "";
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            let message = "요청 처리 중 오류가 발생했습니다.";
            try {
                const body = await response.json();
                message = body.detail || body.message || message;
            } catch (e) {
                /* ignore parse errors */
            }
            throw new Error(message);
        }
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    function renderMemberOptions() {
        const select = memberField();
        select.innerHTML = "";
        members
            .filter((member) => member.active)
            .forEach((member) => {
                const option = document.createElement("option");
                option.value = member.id;
                option.textContent = member.name + " (" + member.baptismalName + ")";
                select.appendChild(option);
            });
    }

    function renderCategoryOptions() {
        const select = categoryField();
        select.innerHTML = "";
        const seen = new Map();
        activityItems.forEach((item) => {
            if (!seen.has(item.categoryId)) seen.set(item.categoryId, item.categoryName);
        });
        seen.forEach((categoryName, categoryId) => {
            const option = document.createElement("option");
            option.value = categoryId;
            option.textContent = categoryName;
            select.appendChild(option);
        });
    }

    function renderItemOptions() {
        const select = itemField();
        select.innerHTML = "";
        const categoryId = Number(categoryField().value);
        activityItems
            .filter((item) => item.categoryId === categoryId)
            .forEach((item) => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.shortName ? item.name + " (" + item.shortName + ")" : item.name;
                select.appendChild(option);
            });
    }

    async function loadOptions() {
        [members, activityItems] = await Promise.all([
            fetchJson("/api/members"),
            fetchJson("/api/activity-items"),
        ]);
        renderMemberOptions();
        renderCategoryOptions();
        renderItemOptions();
    }

    function renderExtraRows(items) {
        lastExtraItems = items;
        const body = extraTbody();
        body.innerHTML = "";

        if (!items.length) {
            body.innerHTML =
                '<tr><td colspan="5" class="table-empty">이번 회차에 등록된 추가 활동이 없습니다.</td></tr>';
            return;
        }

        items.forEach((item) => {
            const tr = document.createElement("tr");
            const itemLabel = item.shortName
                ? item.activityTypeName + " (" + item.shortName + ")"
                : item.activityTypeName;
            tr.innerHTML =
                "<td>" + escapeHtml(item.memberName) + " (" + escapeHtml(item.memberBaptismalName) + ")</td>" +
                "<td>" + escapeHtml(item.categoryName) + "</td>" +
                "<td>" + escapeHtml(itemLabel) + "</td>" +
                '<td class="col-center">' + escapeHtml(item.count) + escapeHtml(item.unit) + "</td>" +
                '<td class="col-actions">' +
                '<button type="button" class="btn-icon edit" data-id="' + item.id + '">수정</button>' +
                '<button type="button" class="btn-icon delete" data-id="' + item.id + '">삭제</button>' +
                "</td>";
            body.appendChild(tr);
        });

        body.querySelectorAll(".btn-icon.edit").forEach((btn) => {
            btn.addEventListener("click", () => openExtraEditModal(Number(btn.dataset.id)));
        });
        body.querySelectorAll(".btn-icon.delete").forEach((btn) => {
            btn.addEventListener("click", () => handleExtraDelete(Number(btn.dataset.id)));
        });
    }

    async function loadExtraList() {
        const meetingId = getMeetingId();
        if (!meetingId) {
            extraTbody().innerHTML =
                '<tr><td colspan="5" class="table-empty">선택된 회차가 없습니다.</td></tr>';
            return;
        }
        extraTbody().innerHTML = '<tr><td colspan="5" class="table-empty">불러오는 중...</td></tr>';
        try {
            const items = await fetchJson("/api/meetings/" + meetingId + "/activity-counts/extra");
            renderExtraRows(items);
        } catch (err) {
            extraTbody().innerHTML =
                '<tr><td colspan="5" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorBox().textContent = "";

        const meetingId = getMeetingId();
        if (!meetingId) {
            errorBox().textContent = "선택된 회차가 없습니다.";
            return;
        }

        const memberId = Number(memberField().value);
        const activityTypeId = Number(itemField().value);
        const count = Number(countField().value);

        if (!memberId || !activityTypeId) {
            errorBox().textContent = "활동단원과 활동항목을 선택해주세요.";
            return;
        }
        if (!Number.isFinite(count) || count < 0) {
            errorBox().textContent = "0 이상의 숫자를 입력해주세요.";
            return;
        }

        try {
            await fetchJson("/api/meetings/" + meetingId + "/activity-counts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, activityTypeId, count }),
            });
            countField().value = "1";
            await ActivityManagement.load();
            await loadExtraList();
        } catch (err) {
            errorBox().textContent = err.message;
        }
    }

    function renderExtraMemberOptions(currentMemberId) {
        const select = extraMemberField();
        select.innerHTML = "";
        const activeMembers = members.filter((member) => member.active);
        const currentMember = members.find((member) => member.id === currentMemberId);
        const options = currentMember && !currentMember.active ? [currentMember, ...activeMembers] : activeMembers;
        options.forEach((member) => {
            const option = document.createElement("option");
            option.value = member.id;
            option.textContent = member.active
                ? member.name + " (" + member.baptismalName + ")"
                : member.name + " (" + member.baptismalName + ", 비활성)";
            select.appendChild(option);
        });
    }

    function renderExtraCategoryOptions() {
        const select = extraCategoryField();
        select.innerHTML = "";
        const seen = new Map();
        activityItems.forEach((item) => {
            if (!seen.has(item.categoryId)) seen.set(item.categoryId, item.categoryName);
        });
        seen.forEach((categoryName, categoryId) => {
            const option = document.createElement("option");
            option.value = categoryId;
            option.textContent = categoryName;
            select.appendChild(option);
        });
    }

    function renderExtraItemOptions() {
        const select = extraItemField();
        select.innerHTML = "";
        const categoryId = Number(extraCategoryField().value);
        activityItems
            .filter((item) => item.categoryId === categoryId)
            .forEach((item) => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.shortName ? item.name + " (" + item.shortName + ")" : item.name;
                select.appendChild(option);
            });
    }

    function openExtraEditModal(id) {
        const item = lastExtraItems.find((entry) => entry.id === id);
        if (!item) return;

        document.getElementById("activity-extra-modal-title").textContent = "활동사항 수정";
        extraIdField().value = item.id;
        renderExtraMemberOptions(item.memberId);
        extraMemberField().value = item.memberId;
        renderExtraCategoryOptions();
        extraCategoryField().value = item.categoryId;
        renderExtraItemOptions();
        extraItemField().value = item.activityTypeId;
        extraCountField().value = item.count;
        extraErrorBox().textContent = "";
        extraModal().classList.add("is-active");
    }

    function closeExtraModal() {
        extraModal().classList.remove("is-active");
    }

    async function handleExtraSubmit(event) {
        event.preventDefault();
        extraErrorBox().textContent = "";

        const meetingId = getMeetingId();
        const id = extraIdField().value;
        if (!meetingId || !id) {
            extraErrorBox().textContent = "선택된 회차가 없습니다.";
            return;
        }

        const memberId = Number(extraMemberField().value);
        const activityTypeId = Number(extraItemField().value);
        const count = Number(extraCountField().value);

        if (!memberId || !activityTypeId) {
            extraErrorBox().textContent = "활동단원과 활동항목을 선택해주세요.";
            return;
        }
        if (!Number.isFinite(count) || count < 0) {
            extraErrorBox().textContent = "0 이상의 숫자를 입력해주세요.";
            return;
        }

        try {
            await fetchJson("/api/meetings/" + meetingId + "/activity-counts/" + id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, activityTypeId, count }),
            });
            closeExtraModal();
            await ActivityManagement.load();
            await loadExtraList();
        } catch (err) {
            extraErrorBox().textContent = err.message;
        }
    }

    async function handleExtraDelete(id) {
        const meetingId = getMeetingId();
        if (!meetingId) return;
        if (!window.confirm("해당 활동 기록을 삭제하시겠습니까?")) return;
        try {
            await fetchJson("/api/meetings/" + meetingId + "/activity-counts/" + id, { method: "DELETE" });
            await ActivityManagement.load();
            await loadExtraList();
        } catch (err) {
            window.alert(err.message);
        }
    }

    function bindEvents() {
        categoryField().addEventListener("change", renderItemOptions);
        form().addEventListener("submit", handleSubmit);

        extraCategoryField().addEventListener("change", renderExtraItemOptions);
        extraForm().addEventListener("submit", handleExtraSubmit);
        document.getElementById("activity-extra-cancel").addEventListener("click", closeExtraModal);
        extraModal().addEventListener("click", (event) => {
            if (event.target === extraModal()) closeExtraModal();
        });
    }

    return {
        async init() {
            if (!initialized) {
                initialized = true;
                bindEvents();
                try {
                    await loadOptions();
                } catch (err) {
                    errorBox().textContent = err.message;
                }
            }
            await loadExtraList();
        },
    };
})();

/* ---------- 월례보고 (Monthly Report) ---------- */
const MonthlyReportManagement = (function () {
    let initialized = false;

    const select = () => document.getElementById("monthly-report-select");
    const rangeLabel = () => document.getElementById("monthly-report-range");
    const officerValue = () => document.getElementById("monthly-report-officer");
    const memberValue = () => document.getElementById("monthly-report-member");
    const carryOverValue = () => document.getElementById("monthly-report-carry-over");
    const incomeValue = () => document.getElementById("monthly-report-income");
    const expenseValue = () => document.getElementById("monthly-report-expense");
    const balanceValue = () => document.getElementById("monthly-report-balance");
    const donationValue = () => document.getElementById("monthly-report-donation");
    const flowerValue = () => document.getElementById("monthly-report-flower");
    const otherValue = () => document.getElementById("monthly-report-other");
    const activitySectionsContainer = () =>
        document.getElementById("monthly-report-activity-sections");

    const MONTH_STORAGE_KEY = "praesidium.selectedMonthlyReportMonth";

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("월례보고 데이터를 불러오지 못했습니다.");
        }
        return response.json();
    }

    function formatStat(present, total) {
        return present + "/" + total;
    }

    function formatAmount(value) {
        return Number(value).toLocaleString("ko-KR") + "원";
    }

    function renderActivitySections(sections) {
        const container = activitySectionsContainer();
        if (!container) return;
        if (!sections || sections.length === 0) {
            container.innerHTML = "";
            return;
        }
        container.innerHTML = sections
            .map((section) => {
                const rows = section.items
                    .map(
                        (item) =>
                            '<div class="monthly-report-activity-row">' +
                            '<span class="monthly-report-activity-label">' +
                            escapeHtml(item.label) +
                            "</span>" +
                            '<span class="monthly-report-activity-value">' +
                            Number(item.count).toLocaleString("ko-KR") +
                            escapeHtml(item.unit) +
                            "</span>" +
                            "</div>"
                    )
                    .join("");
                return (
                    '<div class="monthly-report-activity-group">' +
                    '<h4 class="monthly-report-activity-title">' +
                    escapeHtml(section.title) +
                    "</h4>" +
                    rows +
                    "</div>"
                );
            })
            .join("");
    }

    async function loadReport(yearMonth) {
        rangeLabel().textContent = "불러오는 중...";
        officerValue().textContent = "-";
        memberValue().textContent = "-";
        carryOverValue().textContent = "-";
        incomeValue().textContent = "-";
        expenseValue().textContent = "-";
        balanceValue().textContent = "-";
        donationValue().textContent = "-";
        flowerValue().textContent = "-";
        otherValue().textContent = "-";
        renderActivitySections([]);
        try {
            const report = await fetchJson(
                "/api/monthly-reports?yearMonth=" + encodeURIComponent(yearMonth)
            );
            rangeLabel().textContent = report.meetingRangeLabel;
            officerValue().textContent =
                "간부(" + formatStat(report.officerPresent, report.officerTotal) + ")";
            memberValue().textContent =
                "단원(" + formatStat(report.memberPresent, report.memberTotal) + ")";
            carryOverValue().textContent = formatAmount(report.carryOverAmount);
            incomeValue().textContent = formatAmount(report.incomeTotal);
            expenseValue().textContent = formatAmount(report.expenseTotal);
            balanceValue().textContent = formatAmount(report.balance);
            donationValue().textContent = formatAmount(report.donationTotal);
            flowerValue().textContent = formatAmount(report.flowerTotal);
            otherValue().textContent = formatAmount(report.otherExpenseTotal);
            renderActivitySections(report.activitySections);
        } catch (err) {
            rangeLabel().textContent = escapeHtml(err.message);
        }
    }

    async function init() {
        const sel = select();
        if (!sel) return;

        if (!initialized) {
            initialized = true;
            try {
                const months = await fetchJson("/api/monthly-reports/months");
                sel.innerHTML = months
                    .map((m) => '<option value="' + m + '">' + m + "</option>")
                    .join("");
            } catch (err) {
                sel.innerHTML = "";
                rangeLabel().textContent = escapeHtml(err.message);
                return;
            }

            const savedMonth = window.localStorage.getItem(MONTH_STORAGE_KEY);
            if (savedMonth && sel.querySelector('option[value="' + savedMonth + '"]')) {
                sel.value = savedMonth;
            } else if (sel.value) {
                window.localStorage.setItem(MONTH_STORAGE_KEY, sel.value);
            }

            sel.addEventListener("change", () => {
                window.localStorage.setItem(MONTH_STORAGE_KEY, sel.value);
                if (sel.value) loadReport(sel.value);
            });
        }

        if (sel.value) {
            await loadReport(sel.value);
        }
    }

    return { init };
})();

/* ---------- 사업보고 (Annual Project Report) ---------- */
const ProjectReportManagement = (function () {
    let initialized = false;

    const select = () => document.getElementById("project-report-year");
    const officerValue = () => document.getElementById("project-report-officer");
    const memberValue = () => document.getElementById("project-report-member");
    const carryOverValue = () => document.getElementById("project-report-carry-over");
    const incomeValue = () => document.getElementById("project-report-income");
    const expenseValue = () => document.getElementById("project-report-expense");
    const balanceValue = () => document.getElementById("project-report-balance");
    const eventsContainer = () => document.getElementById("project-report-events");
    const activityContainer = () =>
        document.getElementById("project-report-activity-categories");
    const YEAR_STORAGE_KEY = "praesidium.selectedProjectReportYear";

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("사업보고 데이터를 불러오지 못했습니다.");
        }
        return response.json();
    }

    function formatAmount(value) {
        return Number(value).toLocaleString("ko-KR") + "원";
    }

    function renderReport(report) {
        officerValue().textContent =
            "간부(" + report.officerPresent + "/" + report.officerTotal + ")";
        memberValue().textContent =
            "단원(" + report.memberPresent + "/" + report.memberTotal + ")";
        carryOverValue().textContent = formatAmount(report.carryOverAmount);
        incomeValue().textContent = formatAmount(report.incomeTotal);
        expenseValue().textContent = formatAmount(report.expenseTotal);
        balanceValue().textContent = formatAmount(report.balance);

        eventsContainer().innerHTML = report.legioEvents.length
            ? report.legioEvents
                  .map(
                      (event) =>
                          "<tr><td>" +
                          escapeHtml(event.date) +
                          "</td><td>" +
                          escapeHtml(event.name) +
                          "</td><td>" +
                          escapeHtml(event.place || "-") +
                          "</td></tr>"
                  )
                  .join("")
            : '<tr><td colspan="3" class="table-empty">등록된 레지오행사가 없습니다.</td></tr>';

        activityContainer().innerHTML = report.activityCategories
            .map((category) => {
                const rows = category.activities
                    .map(
                        (activity) =>
                            '<div class="monthly-report-activity-row">' +
                            '<span class="monthly-report-activity-label">' +
                            escapeHtml(activity.name) +
                            "</span>" +
                            '<span class="monthly-report-activity-value">' +
                            Number(activity.count).toLocaleString("ko-KR") +
                            escapeHtml(activity.unit) +
                            "</span></div>"
                    )
                    .join("");
                return (
                    '<div class="monthly-report-activity-group">' +
                    '<h4 class="monthly-report-activity-title">' +
                    escapeHtml(category.name) +
                    " (" +
                    Number(category.total).toLocaleString("ko-KR") +
                    "회)</h4>" +
                    rows +
                    "</div>"
                );
            })
            .join("");
    }

    async function loadReport(year) {
        try {
            renderReport(await fetchJson("/api/project-reports?year=" + encodeURIComponent(year)));
        } catch (err) {
            eventsContainer().innerHTML =
                '<tr><td colspan="3" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
            activityContainer().innerHTML = "";
            officerValue().textContent = "-";
            memberValue().textContent = "-";
            carryOverValue().textContent = "-";
            incomeValue().textContent = "-";
            expenseValue().textContent = "-";
            balanceValue().textContent = "-";
        }
    }

    async function init() {
        const sel = select();
        if (!sel) return;

        if (!initialized) {
            initialized = true;
            try {
                const years = await fetchJson("/api/project-reports/years");
                sel.innerHTML = years
                    .map((year) => '<option value="' + year + '">' + year + "년</option>")
                    .join("");
            } catch (err) {
                sel.innerHTML = "";
                eventsContainer().innerHTML =
                    '<tr><td colspan="3" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
                return;
            }

            const savedYear = window.localStorage.getItem(YEAR_STORAGE_KEY);
            if (savedYear && sel.querySelector('option[value="' + savedYear + '"]')) {
                sel.value = savedYear;
            }
            sel.addEventListener("change", () => {
                window.localStorage.setItem(YEAR_STORAGE_KEY, sel.value);
                if (sel.value) loadReport(sel.value);
            });
        }

        if (!sel.value) {
            eventsContainer().innerHTML =
                '<tr><td colspan="3" class="table-empty">보고할 주회합이 없습니다.</td></tr>';
            return;
        }
        window.localStorage.setItem(YEAR_STORAGE_KEY, sel.value);
        await loadReport(sel.value);
    }

    return { init };
})();

/* ---------- 레지오교본 ---------- */
const LegioManual = (function () {
    let initialized = false;
    const PDF_URL = "/docs/legio_handbook.pdf";

    function frame() {
        return document.getElementById("legio-manual-frame");
    }
    function placeholder() {
        return document.getElementById("legio-manual-placeholder");
    }
    function actions() {
        return document.getElementById("legio-manual-actions");
    }

    async function init() {
        if (initialized) return;
        initialized = true;

        try {
            const response = await fetch(PDF_URL, { method: "HEAD" });
            if (response.ok) {
                frame().src = PDF_URL;
                frame().style.display = "block";
                actions().style.display = "block";
                placeholder().style.display = "none";
            }
        } catch (err) {
            /* PDF가 없으면 안내 문구를 그대로 표시합니다. */
        }
    }

    return { init };
})();

/* ---------- 가톨릭성가 ---------- */
const CatholicSong = (function () {
    let initialized = false;

    async function findSong(event) {
        event.preventDefault();

        const numberInput = document.getElementById("catholic-song-number");
        const status = document.getElementById("catholic-song-status");
        const frame = document.getElementById("catholic-song-frame");
        const number = Number(numberInput.value);

        if (!Number.isInteger(number) || number < 1 || number > 500) {
            status.textContent = "성가번호는 1부터 500까지 입력해 주세요.";
            frame.style.display = "none";
            frame.removeAttribute("src");
            return;
        }

        const pdfUrl = "/api/catholic-songs/" + number;
        status.textContent = "성가 PDF를 찾는 중입니다.";
        frame.style.display = "none";

        try {
            const response = await fetch(pdfUrl, { method: "HEAD" });
            if (!response.ok) {
                frame.removeAttribute("src");
                status.textContent =
                    response.status === 404
                        ? "해당 성가번호의 PDF를 찾을 수 없습니다."
                        : "성가 PDF를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
                return;
            }

            frame.src = pdfUrl;
            frame.style.display = "block";
            status.textContent = number + "번 성가";
        } catch (err) {
            status.textContent = "성가 PDF를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
        }
    }

    function init() {
        if (initialized) return;
        initialized = true;
        document
            .getElementById("catholic-song-search")
            .addEventListener("submit", findSong);
    }

    return { init };
})();

/* ---------- 좌측 메뉴 네비게이션 ---------- */
(function () {
    const menuItems = document.querySelectorAll(".menu-item[data-target]");
    const panels = document.querySelectorAll("[data-panel]");
    const panelTitle = document.getElementById("panel-title");
    const panelCategory = document.getElementById("panel-category");
    const panelDesc = document.getElementById("panel-desc");
    const topbarTitle = document.getElementById("topbar-title");
    let currentTarget = null;

    const PANEL_DESCRIPTIONS = {
        "main-schedule": "영명축일, 단원 축일, 주회합 일정을 달력으로 보여줍니다.",
        "legio-manual": "레지오 마리애 교본 관련 안내입니다.",
        "yahweh-ire": "야훼이레 PDF를 보여줍니다. 화면에 표시되지 않으면 PDF 열기를 이용해 주세요.",
        "catholic-song": "성가번호를 입력해 해당 가톨릭 성가 PDF를 확인합니다.",
    };
    const DEFAULT_DESCRIPTION = "선택한 회차 기준으로 데이터를 보여줍니다.";

    function activateMenu(target) {
        currentTarget = target;
        menuItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.target === target);
        });

        panels.forEach((panel) => {
            panel.classList.toggle("is-active", panel.dataset.panel === target);
        });

        const activeItem = document.querySelector(
            '.menu-item[data-target="' + target + '"]'
        );
        if (activeItem) {
            const label = activeItem.dataset.label || activeItem.textContent.trim();
            const category = activeItem.dataset.category || "";
            if (panelTitle) panelTitle.textContent = label;
            if (panelCategory) panelCategory.textContent = category;
            if (topbarTitle) topbarTitle.textContent = label;
        }
        if (panelDesc) {
            panelDesc.textContent = PANEL_DESCRIPTIONS[target] || DEFAULT_DESCRIPTION;
        }

        window.location.hash = target;

        if (target === "officer-term-management") {
            OfficerTermManagement.init();
        }
        if (target === "meeting-management") {
            MeetingManagement.init();
        }
        if (target === "attendance") {
            AttendanceManagement.load();
        }
        if (target === "accounting") {
            AccountingManagement.load();
        }
        if (target === "main-schedule") {
            MainScheduleCalendar.init();
            ScheduleEventManagement.init();
        }
        if (target === "member-management") {
            MemberManagement.init();
        }
        if (target === "activity-item-management") {
            ActivityItemManagement.init();
        }
        if (target === "activity") {
            ActivityManagement.load();
            ActivityRegisterManagement.init();
        }
        if (target === "monthly-report") {
            MonthlyReportManagement.init();
        }
        if (target === "project-report") {
            ProjectReportManagement.init();
        }
        if (target === "legio-manual") {
            LegioManual.init();
        }
        if (target === "catholic-song") {
            CatholicSong.init();
        }
    }

    menuItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            activateMenu(item.dataset.target);
        });
    });

    const sessionSelect = document.getElementById("session-select");

    if (sessionSelect) {
        sessionSelect.addEventListener("change", (event) => {
            if (currentTarget === "attendance") {
                AttendanceManagement.load();
            }
            if (currentTarget === "accounting") {
                AccountingManagement.load();
            }
            if (currentTarget === "activity") {
                ActivityManagement.load();
                ActivityRegisterManagement.init();
            }
        });
    }

    const initialTarget =
        window.location.hash && window.location.hash.length > 1
            ? window.location.hash.substring(1)
            : menuItems[0] && menuItems[0].dataset.target;

    if (initialTarget) {
        activateMenu(initialTarget);
    }
})();
