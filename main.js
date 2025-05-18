console.log("komootGPXport activated");

const interval = setInterval(function () {
    if (document.querySelector('#download-gpx'))
        return;

    const saveBtn = document.querySelector("[data-test-id=p_tour_save]");
    if (!saveBtn) {
        console.error('No "Save route" button found');
        return;
    }

    const downloadBtn = document.createElement("button");
    downloadBtn.className = saveBtn.className;
    downloadBtn.id = 'download-gpx';
    downloadBtn.innerHTML = 'Download GPX';
    downloadBtn.addEventListener('click', () => {
        clearInterval(interval);
        const ktmPage = kmtBoot.getProps().page;
        if (ktmPage === undefined) {
            alert('Cannot find page element in source. Is this your own tour?')
        }
        const tour_link = ktmPage.links?.tour?.href
        const coords = ktmPage.linksEmbedded?.tour?.linksEmbedded?.coordinates?.attributes?.items;

        if (coords !== undefined) {
            // Got coordinates in the source, nice
            let gpx = jsonToGpx(coords);
            downloadGpx(`route.gpx`, gpx);
        } else if (tour_link !== undefined) {
            // Download JSON and fetch coords from there
            fetch(tour_link)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return response.json();
                })
                .then(tour_data => {
                    const coordinates_link = tour_data._links.coordinates.href;
                    fetch(coordinates_link)
                        .then(response => {
                        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                        return response.json();
                    }).then(coordinates_data => {
                        let gpx = jsonToGpx(coordinates_data.items);
                        downloadGpx(`route.gpx`, gpx);
                    })
                    .catch(err => {
                        console.error('Failed to load coordinates JSON:', err);
                    });
                })
                .catch(err => {
                    console.error('Failed to load tour JSON:', err);
                });
        } else {
            alert('There was an error reading the points of your route. If this keeps happening feel free to open an issue.');
            return;     
        }
    });
    saveBtn.parentElement.appendChild(downloadBtn);
}, 1000);

const jsonToGpx = (coords) => {
    let gpx =
        `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<gpx version="1.1" creator="komootGPXport">
  <metadata></metadata>
  <rte>
  ${coords.map((coord) => {
            return `<rtept lat="${coord.lat}" lon="${coord.lng}"><ele>${coord.alt}</ele></rtept>`
        }).join('\n')
        }
  </rte>
</gpx>`;

    return gpx;
}

const downloadGpx = (filename, text) => {
    let elem = document.createElement('a');
    elem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    elem.setAttribute('download', filename);

    elem.style.display = 'none';
    document.body.appendChild(elem);

    elem.click();

    document.body.removeChild(elem);
}