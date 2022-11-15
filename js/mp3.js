window.onload = function() {

    const file = document.getElementById("file-input");
    const h3 = document.getElementById("name");
    const audio = document.getElementById("audio");
    const svg = document.getElementById("svg");

    const d3svg = d3.select("#svg")
                .append("g")
                .attr("transform", "translate(250,250)");



    const audioContext = new AudioContext();
    const track = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();

    track.connect(analyser);
    analyser.connect(audioContext.destination);
    // Flow: Audio => Analyser (Used for collecting data) => Destination (Being played)

    var id;

    file.onchange = function() {

        // File

        const files = this.files;
        audio.src = URL.createObjectURL(files[0]);

        const name = files[0].name;
        h3.innerHTML = name;



        // Audio

        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        clearInterval(id);
        id = setInterval(frequencyVisualization, 1000 / 60);



        // Visualization

        var color = d3.scaleLinear().domain([0,255])
            .range(["blue", "red"]);

        function frequencyVisualization() {
            analyser.getByteFrequencyData(dataArray);
            
            var freqArc = d3svg.selectAll(".freq-arc")
                .data(dataArray);

            freqArc
                .exit()
                .remove();

            freqArc
                .enter()
                .append("path")
                .merge(freqArc)
                .attr("class", "freq-arc")
                .attr("d", (d, i) => {
                    return (d3.arc()
                        .innerRadius(100)
                        .outerRadius(100 + (d / 3))
                        .startAngle((2 * Math.PI / dataArray.length) * i)
                        .endAngle((2 * Math.PI / dataArray.length) * (i + 1)))();
                })
                .attr("fill", (d) => {return color(d)});
        };
    }
    document.getElementById("prev-btn").addEventListener("click", () => {
        window.location.replace("/");
    })
    
}
