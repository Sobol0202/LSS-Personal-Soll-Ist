// ==UserScript==
// @name         LSS Personal Soll-Ist
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Fügt Personalverwaltungsfunktionen hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Lesen von Daten aus dem lokalen Speicher
    function getLocalStorageData() {
        const data = localStorage.getItem('personalData');
        return data ? JSON.parse(data) : {};
    }

    // Funktion zum Schreiben von Daten in den lokalen Speicher
    function setLocalStorageData(data) {
        localStorage.setItem('personalData', JSON.stringify(data));
    }

    // Funktion zur Aktualisierung des Eingabefelds
    function updateInputField(buildingId) {
        const personalData = getLocalStorageData();
        const personalCount = personalData[buildingId] || 0;
        inputField.value = personalCount;
    }

    // Funktion zur Aktualisierung der Personalanzahl
    function updatePersonalCount(buildingId, count) {
        const personalData = getLocalStorageData();
        personalData[buildingId] = count;
        setLocalStorageData(personalData);
    }

    // Funktion zum Löschen der Personalanzahl
    function deletePersonalCount(buildingId) {
        const personalData = getLocalStorageData();
        delete personalData[buildingId];
        setLocalStorageData(personalData);
        updateInputField(buildingId);
    }

    // Erstellen eines DIV-Elements für die Benutzeroberfläche
    const personalDiv = document.createElement('div');
    personalDiv.innerHTML = `
        <input id="personalCountInput" type="number" placeholder="Personalzahl">
        <button id="confirmButton" class="btn btn-xs btn-success">Bestätigen</button>
        <button id="deleteButton" class="btn btn-xs btn-danger">-</button>
        <button id="showTableButton" class="btn btn-default btn-xs">Zeige Tabelle</button>
    `;

    // Suchen des "Rekrutieren"-Buttons auf der Seite und Einfügen des DIV-Elements danach
    const recruitButton = document.querySelector('a[href$="/hire"]');
    recruitButton.insertAdjacentElement('afterend', personalDiv);

    // Abfragen von DOM-Elementen
    const inputField = document.getElementById('personalCountInput');
    const confirmButton = document.getElementById('confirmButton');
    const deleteButton = document.getElementById('deleteButton');
    const showTableButton = document.getElementById('showTableButton');

    // Extrahieren der Gebäude-ID aus der aktuellen URL
    const buildingId = window.location.pathname.split('/').pop();
    updateInputField(buildingId);

    // Event-Listener für den "Bestätigen"-Button
    confirmButton.addEventListener('click', function() {
        const personalCount = parseInt(inputField.value);
        updatePersonalCount(buildingId, personalCount);
        alert(`Personalzahl ${personalCount} für Gebäude ${buildingId} gespeichert!`);
    });

    // Event-Listener für den "Löschen"-Button
    deleteButton.addEventListener('click', function() {
        if (confirm('Möchten Sie diese Personalzahl löschen?')) {
            deletePersonalCount(buildingId);
            alert(`Personalzahl für Gebäude ${buildingId} gelöscht!`);
        }
    });

    // Event-Listener für den "Zeige Tabelle"-Button
    showTableButton.addEventListener('click', function() {
        showBuildingTable();
    });

    // Funktion zum Anzeigen einer Tabelle mit Gebäudeinformationen
    async function showBuildingTable() {
        const buildingsResponse = await fetch('https://www.leitstellenspiel.de/api/buildings');
        const buildingsData = await buildingsResponse.json();

        // Erstellen einer HTML-Tabelle
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Soll Personal</th>
                <th>Ist Personal</th>
            </tr>
        `;

        const personalData = getLocalStorageData();

        // Iterieren durch die gespeicherten Personaldaten und Gebäudeinformationen
        for (const buildingId in personalData) {
            const buildingInfo = buildingsData.find(building => building.id === parseInt(buildingId));
            if (buildingInfo) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${buildingId}</td>
                    <td><a href="https://www.leitstellenspiel.de/buildings/${buildingId}" target="_blank">${buildingInfo.caption}</a></td>
                    <td>${personalData[buildingId]}</td>
                    <td>${buildingInfo.personal_count}</td>
                    <td><button class="btn btn-xs btn-danger delete-button">-</button></td>
                `;

                // Überprüfen, ob der PersonalCount größer als das Ist Personal ist
                if (personalData[buildingId] < buildingInfo.personal_count) {
                    row.style.backgroundColor = 'green'; // Hintergrundfarbe grün setzen
                }

                // Hinzufügen eines Event Listeners für den Löschen-Button
                const deleteButton = row.querySelector('.delete-button');
                deleteButton.addEventListener('click', function() {
                    //if (confirm('Möchten Sie diese Personalzahl löschen?')) {
                        deletePersonalCount(buildingId);
                        //alert(`Personalzahl für Gebäude ${buildingId} gelöscht!`);
                        // Aktualisiere die Tabelle, nachdem ein Eintrag gelöscht wurde
                        showBuildingTable();
                    //}
                });

                table.appendChild(row);
            }
        }

        // Öffnen eines Popup-Fensters und Anhängen der Tabelle
        const popup = window.open('', '_blank');
        popup.document.body.appendChild(table);
    }
})();
