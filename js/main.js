const margin = {top: -210, right: 0, bottom: 0, left: 75},
  width = 300 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom

const genreSVG = d3.select("#genre-blobs")
  .append("svg")
  .attr("width", width + margin.left + margin.right + 100)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top + 100) + ")");

// define our tooltip div
const tooltip = d3.select("body").append("div")	
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("background-color", "white")
    .style("opacity", 0)


const files = ["data/model-data.json"];
const promises = [];
files.forEach(function(url){
	promises.push(d3.json(url))
});

Promise.all(promises).then(function(values){
    data = values[0];
    genres = data.map((d) => d.Genre)
    uniqueGenres = new Set(genres)
    
    const scaleGenreColor = d3.scaleOrdinal(genres)
        .domain(genres)
        .range(d3.schemeCategory10)
    
    const scaleGenreDistance = d3.scalePoint()
        .domain(uniqueGenres)
        .range([0, 100])  

    // count the amount of times each song appears
    let songCount = {};
    data.forEach(function(d) {
        if (songCount[d.Song]) {
            songCount[d.Song] += 1;
        } else {
            songCount[d.Song] = 1;
        }
    });

    // get the top 5 songs and their counts
    let topSongs = Object.keys(songCount).sort(function(a, b) {
        return songCount[b] - songCount[a];
    }).slice(0, 5);

    let topSongCounts = topSongs.map(function(d) {
        return songCount[d];
    });

    // create a scale for the text size
    let scaleTextSize = d3.scaleLinear()
        .domain([0, d3.max(topSongCounts)])
        .range([10, 50]);

    // data about the top 5 of each weekday: count, genre, and song name
    let topSongData = [];
    topSongs.forEach(function(d) {
        let songGenre = data.filter(function(e) {
            return e.Song == d;
        })[0].Genre;
        topSongData.push({
            "count": songCount[d],
            "genre": songGenre,
            "song": d
        });
    });

    // make a json that splits the data based on their weekday
    let weekdayData = [];
    let weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    weekdays.forEach(function(d) {
        let weekdaySongs = data.filter(function(e) {
            return e["Day of the week"] == d;
        });
        weekdayData.push({
            "weekday": d,
            "songs": weekdaySongs
        });
    });

    // WEEK SUMMARY
    const weekDiv = document.getElementById("week-summary");
    Array.from(weekDiv.children).forEach(n => 
        Array.from(n.children).forEach(div => {
            if (div.tagName !== "P") {
                // const margin = {top: 10, right: 10, bottom: 0, left: 75}
                const width = 700
                const height = 50
                const weekSVG = d3.select(div).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                // .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top + 100) + ")")
                
                let valueX = 50
                let valueY = 25
                // get the div's name
                let divName = div.getAttribute("name");
                // lowercase the weekdays array
                let lowerWeekdays = weekdays.map(function(d) {
                    return d.toLowerCase();
                });
                // match the div's name to the weekday
                let index = lowerWeekdays.indexOf(divName);
                // get the data for that weekday
                let weekday = weekdayData[index];
                // we want objects like this {song: "", count: 0, genre: ""}
                let songData = [];
                weekday.songs.forEach(function(d) {
                    let song = d.Song;
                    let genre = d.Genre;
                    let artist = d.Artist;
                    let count = 0;
                    // if the song is already in the array, increment the count
                    songData.forEach(function(e) {
                        if (e.song == song) {
                            e.count += 1;
                            count += 1;
                        }
                    });
                    // if the song is not in the array, add it
                    if (count == 0) {
                        songData.push({
                            "song": song,
                            "count": 1,
                            "genre": genre,
                            "artist": artist
                        });
                    }
                });
                // sort the array by count
                songData.sort(function(a, b) {
                    return b.count - a.count;
                });
                // get the top 5 songs
                let topSongs = songData.slice(0, 5);    
                let totalX = 0

                weekSVG
                .selectAll("rect")
                .data(topSongs)
                .enter()
                .append("rect")
                .attr("x", function(d, i) {
                    let temp = totalX
                    totalX += valueX * d.count
                    if (i === 0) return 0
                    return temp
                })
                .attr("y", valueY/2)
                .attr("width", (d, i) => {
                    return valueX * d.count
                })
                .attr("height", valueY)
                .attr("fill", function(d) {
                    return scaleGenreColor(d.genre)
                })
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .on("mouseover", function(event, d) {	
                    tooltip.transition()		
                        .duration(300)		
                        .style("opacity", .9);		
                    tooltip.html(d.song + "<br/>"  + d.artist + "<br/>" + d.count + " plays")	
                        .style("left", (event.pageX + 10) + "px")		
                        .style("top", (event.pageY - 29) + "px");	
                    })		
                .on("mouseout", function(event, d) {		
                    tooltip.transition()		
                        .duration(500)		
                        .style("opacity", 0);	
                });
                
            }
        })
    )
    // GENRE BLOBS  

    d3.select("#genre-blobs").append("g")

    let node = genreSVG.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('fill', function(d) { return scaleGenreColor(d.Genre); })
    .call(d3.drag()
    .on('start', dragstart)
    .on('drag', drag)
    .on('end', dragend))    

    node.on("mouseover", function(event, d) {	
        tooltip.transition()		
            .duration(300)		
            .style("opacity", .9);		
        tooltip.html(d.Song + "<br/>"  + d.Artist + "<br/>" + d.Genre)	
            .style("left", (event.pageX + 25) + "px")		
            .style("top", (event.pageY - 29) + "px");	
        })		
    .on("mouseout", function(event, d) {		
        tooltip.transition()		
            .duration(500)		
            .style("opacity", 0);	
    })

    const simulation = d3.forceSimulation(data)
    .force("charge", d3.forceManyBody().strength(-.08))
    simulation.on("tick", function() {
      node
      .attr("cx", function(d)  { return d.x; })
      .attr("cy", function(d) { return d.y; })
    });
  


    // helper functions for node dragging
    function dragstart(d) {
        if (!d.active) simulation.alphaTarget(0.3).restart();
        d.subject.fx = d.subject.x;
        d.subject.fy = d.subject.y;
    }
  
    function drag(d) {
        d.subject.fx = d.x;
        d.subject.fy = d.y;
    }
  
    function dragend(d) {
        if (!d.active) simulation.alphaTarget(0);
        d.subject.fx = null;
        d.subject.fy = null;
    }

    // TEXT SIZE RANKING

    // display onto the page

    // reverse topSongs
    
    d3.select("#text-size-ranking")
        .selectAll("p")
        .data(topSongs.reverse())
        .enter().append("p")
        .html(function(d, i) {
            return (topSongs.length - i) + ". " + d + " (" + songCount[d] + ")";
        })
        .style("font-size", function(d) {
            return scaleTextSize(songCount[d]) + "px";
        });
});

// progress bar
const progress = document.getElementById('progress');

const nextButton = document.getElementById('next-btn');
nextButton.addEventListener("click", () => {
    window.location.replace("./mp3.html");
})
