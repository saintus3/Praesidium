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
    };

    const EVENT_DOT_COLOR = {
        FEAST_DAY: "#9aa3b5",
        MEMBER_FEAST: "#3a7afe",
        MEETING: "#2fb380",
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
    const headerRow = () => document.getElementById("activity-count-header");
    const tbody = () => document.getElementById("activity-count-tbody");

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
                "<td>" + escapeHtml(member.memberName) + " (" + escapeHtml(member.memberBaptismalName) + ")</td>";

            member.counts.forEach((cell) => {
                cells +=
                    '<td class="col-center">' +
                    '<input type="number" min="0" step="1" class="finance-inline-input activity-count-input" ' +
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
            renderHeader(grid.columns);
            renderRows(grid.columns, grid.members);
            tbody().querySelectorAll(".activity-count-input").forEach((input) => {
                input.dataset.lastValue = input.value;
            });
        } catch (err) {
            tbody().innerHTML =
                '<tr><td colspan="2" class="table-empty">' + escapeHtml(err.message) + "</td></tr>";
        }
    }

    return { load };
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
        if (target === "attendance") {
            AttendanceManagement.load();
        }
        if (target === "accounting") {
            AccountingManagement.load();
        }
        if (target === "main-schedule") {
            MainScheduleCalendar.init();
        }
        if (target === "member-management") {
            MemberManagement.init();
        }
        if (target === "activity-item-management") {
            ActivityItemManagement.init();
        }
        if (target === "activity") {
            ActivityManagement.load();
        }
    }

    menuItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            activateMenu(item.dataset.target);
        });
    });

    const SESSION_STORAGE_KEY = "praesidium.selectedSessionId";
    const sessionSelect = document.getElementById("session-select");

    if (sessionSelect) {
        const savedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (
            savedSessionId &&
            sessionSelect.querySelector('option[value="' + savedSessionId + '"]')
        ) {
            sessionSelect.value = savedSessionId;
        } else {
            window.localStorage.setItem(SESSION_STORAGE_KEY, sessionSelect.value);
        }

        sessionSelect.addEventListener("change", (event) => {
            window.localStorage.setItem(SESSION_STORAGE_KEY, event.target.value);
            if (currentTarget === "attendance") {
                AttendanceManagement.load();
            }
            if (currentTarget === "accounting") {
                AccountingManagement.load();
            }
            if (currentTarget === "activity") {
                ActivityManagement.load();
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
