use chrono::NaiveTime;
use gnuplot::{Caption, Color, Figure};
use plotters::prelude::*;
use regex::{Regex, RegexSet};

use std::{
    collections::{hash_map::Entry, HashMap},
    error::Error,
    fs::File,
    io::{prelude::*, BufReader, BufWriter, Write},
};

// TODO: number block requests sent (total and per-peer)
// TODO: number of block responses received (total and per-peer)
// TODO: number of failed block requests (total and per-peer)
// TODO: number of notifications received for each substream (total and per-peer)
// TODO: number of notifications sent for each substream (total and per-peer)
// TODO: number of evicted peers
// TODO: how to visualize this information?

struct BlockHeight {
    time: String,
    best: usize,
    finalized: usize,
}

struct BlockAnnouncement {
    time: String,
    number: usize,
}

struct PeerInformation {
    /// How many block requests were sent to peer.
    sent_block_requests: usize,

    /// How many block requests were received from peer.
    received_block_responses: usize,

    /// How many block requests failed.
    block_request_failures: usize,
}

struct Execution {
    /// Number of peers.
    peers: Vec<usize>,
}

const OUT_FILE_NAME: &'static str = "histogram.png";

fn export_to_csv(filename: &str, data: Vec<(String, usize)>) -> Result<(), Box<dyn Error>> {
    let file = File::create(filename)?;
    let mut writer = BufWriter::new(file);

    for (time, data) in data {
        let line = format!("{},{}\n", time, data);
        writer.write_all(line.as_bytes())?;
    }

    writer.flush()?;

    Ok(())
}

fn export(filename: &str, data: Vec<String>) -> Result<(), Box<dyn Error>> {
    let file = File::create(filename)?;
    let mut writer = BufWriter::new(file);

    for line in data {
        writer.write_all(line.as_bytes())?;
    }

    writer.flush()?;

    Ok(())
}

pub fn analyze_block_height(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
    let set = RegexSet::new(&[
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*target=#(\d+) \((\d+) peers\).*best: #(\d+).*finalized #(\d+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Pre-validating received.*with number (\d+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Header ([^\s]+) has (\d+) logs",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Block imported successfully Some\(\d+\) \(([^\s]+)\).*",
    ])
    .unwrap();
    let regexes: Vec<_> = set
        .patterns()
        .iter()
        .map(|pat| Regex::new(pat).unwrap())
        .collect();

    let mut block_heights = Vec::new();
    let mut block_announcements = Vec::new();
    let mut pending_block_imports = HashMap::new();
    let mut block_import_times = HashMap::new();
    let mut test_import_times = Vec::new();
    let mut highest = 0u32;
    let mut peers = Vec::new();

    let mut block_heights_v2 = vec![String::from("time,best,finalized\n")];
    let mut import_times = vec![String::from("time\n")];

    for line in reader.lines() {
        let line = line?;
        let matches = set
            .matches(&line)
            .into_iter()
            .map(|match_idx| (match_idx, &regexes[match_idx]))
            .map(|(idx, pat)| (idx, pat.captures(&line).unwrap()))
            .collect::<Vec<_>>();

        if matches.is_empty() {
            continue;
        }

        if matches.len() > 1 {
            panic!("invalid line");
        }

        let (index, captures) = &matches[0];

        match index {
            0 => {
                peers.push((
                    captures[2].to_string(),
                    captures[4].parse::<usize>().unwrap(),
                ));

                block_heights_v2.push(format!(
                    "{},{},{}\n",
                    &captures[2], &captures[5], &captures[6],
                ));

                block_heights.push(BlockHeight {
                    time: captures[2].to_string(),
                    best: captures[5].parse::<usize>().unwrap(),
                    finalized: captures[6].parse::<usize>().unwrap(),
                });
            }
            1 => {
                block_announcements.push(BlockAnnouncement {
                    time: captures[2].to_string(),
                    number: captures[3].parse::<usize>().unwrap(),
                });
            }
            2 => {
                pending_block_imports.insert(captures[3].to_owned(), captures[2].to_owned());
            }
            3 => {
                if let Some(time) = pending_block_imports.remove(&captures[3]) {
                    let time1 = NaiveTime::parse_from_str(&time, "%H:%M:%S%.3f").unwrap();
                    let time2 = NaiveTime::parse_from_str(&captures[2], "%H:%M:%S%.3f").unwrap();
                    let duration = time2.signed_duration_since(time1);
                    let test = duration.num_milliseconds();
                    import_times.push(format!("{}\n", test));
                    *block_import_times.entry(test).or_insert(0) += 1;
                    // let test = u32::try_from(test).unwrap();
                    // test_import_times.push(test);
                    // if test > highest {
                    //     highest = test;
                    // }
                }
            }
            _ => {
                println!("{captures:?}");
            }
        }
    }

    println!("done with loop {peers:#?}");
    export_to_csv("peers.csv", peers).unwrap();
    export("block_info.csv", block_heights_v2).unwrap();
    export("block_import_times.csv", import_times).unwrap();

    // let root = BitMapBackend::new(OUT_FILE_NAME, (1000, 1000)).into_drawing_area();

    // root.fill(&WHITE)?;

    // let mut chart = ChartBuilder::on(&root)
    //     .x_label_area_size(35)
    //     .y_label_area_size(40)
    //     .margin(5)
    //     .caption("Block import times", ("sans-serif", 50.0))
    //     .build_cartesian_2d(
    //         (0u32..highest).into_segmented(),
    //         0u32..block_import_times.len() as u32,
    //     )?;

    // chart
    //     .configure_mesh()
    //     .disable_x_mesh()
    //     .y_desc("Count")
    //     .x_desc("Milliseconds")
    //     .axis_desc_style(("sans-serif", 15))
    //     .draw()?;

    // chart.draw_series(
    //     Histogram::vertical(&chart).data(test_import_times.iter().map(|x: &u32| (*x, 1))),
    // )?;

    // // To avoid the IO failure being ignored silently, we manually call the present function
    // root.present().expect("Unable to write result to file, please make sure 'plotters-doc-data' dir exists under current dir");
    // println!("Result has been saved to {}", OUT_FILE_NAME);

    // let best = block_heights
    //     .iter()
    //     .map(|info| info.best)
    //     .collect::<Vec<usize>>();
    // let finalized = block_heights
    //     .iter()
    //     .map(|info| info.finalized)
    //     .collect::<Vec<usize>>();
    // let time = block_heights
    //     .iter()
    //     .enumerate()
    //     .map(|(i, _info)| i)
    //     .collect::<Vec<usize>>();
    // let block_announcements = block_announcements
    //     .iter()
    //     .map(|info| info.number)
    //     .collect::<Vec<usize>>();
    // let time2 = block_announcements
    //     .iter()
    //     .enumerate()
    //     .map(|(i, _info)| i)
    //     .collect::<Vec<usize>>();
    // let mut fg = Figure::new();
    // fg.axes2d()
    //     .lines(&time, &best, &[Caption("Best block"), Color("blue")])
    //     .lines(
    //         &time,
    //         &finalized,
    //         &[Caption("Finalized block"), Color("red")],
    //     );
    // fg.save_to_svg("best_and_finalized.svg", 1000, 1000)
    //     .unwrap();

    // let mut fg = Figure::new();
    // fg.axes2d().lines(
    //     &time2,
    //     &block_announcements,
    //     &[Caption("Block announcement"), Color("blue")],
    // );
    // fg.save_to_svg("block_announcements.svg", 1000, 1000)
    //     .unwrap();
    Ok(())
}
