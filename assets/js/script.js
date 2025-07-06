document.addEventListener('DOMContentLoaded', function() {
    
    // Map functionality
    if(document.getElementById('map')) {
        
        const map = L.map('map').setView([27.7172, 85.3240], 12); 

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        
        let bufferLayer = null;

        const drawOptions = {
            polyline: { shapeOptions: { color: '#ff0000', weight: 3 } },
            polygon: {
                allowIntersection: false,
                drawError: { color: '#e1e100', message: 'You can\'t draw that!' },
                shapeOptions: { color: '#00bcd4', weight: 3 }
            },
            circle: false, rectangle: false, marker: false, circlemarker: false
        };

        const drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: drawOptions
        });
        
        const bufferBtn = document.getElementById('bufferBtn');
        const measureBtn = document.getElementById('measureBtn');
        const areaBtn = document.getElementById('areaBtn');

        bufferBtn.addEventListener('click', function() {
            map.removeControl(drawControl);
            alert('Buffer tool activated! Click on the map to draw a 1km buffer.');
            
            map.once('click', function(e) {
                if (bufferLayer) { map.removeLayer(bufferLayer); }
                const point = turf.point([e.latlng.lng, e.latlng.lat]);
                const buffered = turf.buffer(point, 1, {units: 'kilometers'});
                bufferLayer = L.geoJSON(buffered, {
                    style: { color: "#00bcd4", weight: 2, opacity: 0.8, fillColor: "#00bcd4", fillOpacity: 0.3 }
                }).addTo(map);
                bufferLayer.bindPopup('This is a 1km buffer.').openPopup();
            });
        });

        measureBtn.addEventListener('click', function() {
            map.addControl(drawControl);
            new L.Draw.Polyline(map, drawControl.options.draw.polyline).enable();
            alert('Measure tool activated! Draw a line on the map.');
        });
        
        areaBtn.addEventListener('click', function() {
            map.addControl(drawControl);
            new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable();
            alert('Area tool activated! Draw a polygon on the map.');
        });

        map.on(L.Draw.Event.CREATED, function (event) {
            const layer = event.layer;
            const type = event.layerType;

            drawnItems.clearLayers();
            drawnItems.addLayer(layer);

            if (type === 'polyline') {
                let distance = 0;
                const latlngs = layer.getLatLngs();
                for (let i = 0; i < latlngs.length - 1; i++) {
                    distance += latlngs[i].distanceTo(latlngs[i + 1]);
                }
                const distanceInKm = (distance / 1000).toFixed(2);
                layer.bindPopup(`<b>Distance:</b> ${distanceInKm} km`).openPopup();
            } else if (type === 'polygon') {
                const geojson = layer.toGeoJSON();
                const area = turf.area(geojson);
                const areaInSqM = area.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                layer.bindPopup(`<b>Area:</b> ${areaInSqM} m²`).openPopup();
            }
            
            map.removeControl(drawControl);
        });
    }
});