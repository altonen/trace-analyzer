use gnuplot::{Caption, Color, Figure};
use regex::{Regex, RegexSet};

use std::{
    error::Error,
    fs::File,
    io::{prelude::*, BufReader},
};

struct BlockHeight {
    time: String,
    best: usize,
    finalized: usize,
}

struct BlockAnnouncement {
    time: String,
    number: usize,
}

pub fn analyze_block_height(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
    let set = RegexSet::new(&[
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*target=#(\d+).*best: #(\d+).*finalized #(\d+)",
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
                block_heights.push(BlockHeight {
                    time: captures[2].to_string(),
                    best: captures[4].parse::<usize>().unwrap(),
                    finalized: captures[5].parse::<usize>().unwrap(),
                });
            }
            1 => {
                block_announcements.push(BlockAnnouncement {
                    time: captures[2].to_string(),
                    number: captures[3].parse::<usize>().unwrap(),
                });
            }
            2 => {
                println!("{:?}: {:?}", &captures[2], &captures[3]);
            }
            3 => {
                println!("{:?}: {:?}", &captures[2], &captures[3]);
            }
            _ => {
                println!("{captures:?}");
            }
        }
    }

    println!("done with loop");

    let best = block_heights
        .iter()
        .map(|info| info.best)
        .collect::<Vec<usize>>();
    let finalized = block_heights
        .iter()
        .map(|info| info.finalized)
        .collect::<Vec<usize>>();
    let time = block_heights
        .iter()
        .enumerate()
        .map(|(i, _info)| i)
        .collect::<Vec<usize>>();
    let block_announcements = block_announcements
        .iter()
        .map(|info| info.number)
        .collect::<Vec<usize>>();
    let time2 = block_announcements
        .iter()
        .enumerate()
        .map(|(i, _info)| i)
        .collect::<Vec<usize>>();
    let mut fg = Figure::new();
    fg.axes2d()
        .lines(&time, &best, &[Caption("Best block"), Color("blue")])
        .lines(
            &time,
            &finalized,
            &[Caption("Finalized block"), Color("red")],
        );
    fg.save_to_svg("best_and_finalized.svg", 1000, 1000)
        .unwrap();

    let mut fg = Figure::new();
    fg.axes2d().lines(
        &time2,
        &block_announcements,
        &[Caption("Block announcement"), Color("blue")],
    );
    fg.save_to_svg("block_announcements.svg", 1000, 1000)
        .unwrap();
    Ok(())
}
