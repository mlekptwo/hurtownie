const map = L.map('map').setView([52.1, 19.4], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const hurtowniaColors = {};
function getColor(hurtownia) {
    if (!hurtowniaColors[hurtownia]) {
        const hash = [...hurtownia].reduce((a, c) => a + c.charCodeAt(0), 0);
        const r = (hash * 123) % 255;
        const g = (hash * 321) % 255;
        const b = (hash * 213) % 255;
        hurtowniaColors[hurtownia] = `rgb(${r},${g},${b})`;
    }
    return hurtowniaColors[hurtownia];
}

let geojsonLayer;

function loadCSVData(callback) {
    Papa.parse("data.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data.reduce((acc, row) => {
                acc[row.postcode] = row.hurtownia.trim();
                return acc;
            }, {});
            const unique = [...new Set(Object.values(data))].sort();
            const select = document.getElementById("hurtowniaSelect");
            unique.forEach(h => {
                const opt = document.createElement("option");
                opt.value = h;
                opt.text = h;
                select.appendChild(opt);
            });
            callback(data);
        }
    });
}

function loadGeoJSONLayer(hurtowniaData, selected = "") {
    if (geojsonLayer) map.removeLayer(geojsonLayer);
    fetch("https://raw.githubusercontent.com/codeforpoland/postcode-boundaries/master/postcodes.geojson")
        .then(res => res.json())
        .then(geojson => {
            geojsonLayer = L.geoJSON(geojson, {
                style: function(feature) {
                    const code = feature.properties.postcode;
                    const hurtownia = hurtowniaData[code];
                    if (!hurtownia || (selected && hurtownia !== selected)) {
                        return { fillOpacity: 0, opacity: 0 };
                    }
                    return {
                        color: "#333",
                        weight: 1,
                        fillColor: getColor(hurtownia),
                        fillOpacity: 0.6
                    };
                },
                onEachFeature: function (feature, layer) {
                    const code = feature.properties.postcode;
                    const hurtownia = hurtowniaData[code];
                    if (hurtownia) {
                        layer.bindPopup(`<b>${hurtownia}</b><br>Kod: ${code}`);
                    }
                }
            }).addTo(map);
        });
}

document.getElementById("hurtowniaSelect").addEventListener("change", function(e) {
    const selected = e.target.value;
    loadCSVData(hurtowniaData => loadGeoJSONLayer(hurtowniaData, selected));
});

loadCSVData(hurtowniaData => loadGeoJSONLayer(hurtowniaData));
