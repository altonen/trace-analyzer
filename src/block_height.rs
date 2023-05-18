use gnuplot::{Caption, Color, Figure};
use regex::Regex;

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

pub fn analyze_block_height(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
    // let re = Regex::new(r"target=#(\d+).*best: #(\d+).*finalized #(\d+)").unwrap();
    // let re = Regex::new(r"r'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*target=#(\d+).*best: #(\d+).*finalized #(\d+)'").unwrap();
    let re = Regex::new(r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*target=#(\d+).*best: #(\d+).*finalized #(\d+)").unwrap();

    let mut block_heights = Vec::new();

    for line in reader.lines() {
        let line = line?;

        match re.captures(&line) {
            None => {
                continue;
            }
            Some(captures) => {
                block_heights.push(BlockHeight {
                    time: captures[2].to_string(),
                    best: captures[4].parse::<usize>().unwrap(),
                    finalized: captures[5].parse::<usize>().unwrap(),
                });
            }
        }
    }

    for block_height in &block_heights {
        println!(
            "{}: best {} finalized {}",
            block_height.time, block_height.best, block_height.finalized
        );
    }

    let y = [
        block_heights[0].best,
        block_heights[block_heights.len() - 1].best + 100,
    ];
    // let y = [3u32, 4, 5];
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
    let mut fg = Figure::new();
    fg.axes2d()
        .lines(&time, &best, &[Caption("Best block"), Color("blue")])
        .lines(
            &time,
            &finalized,
            &[Caption("Finalized block"), Color("red")],
        );
    fg.show().unwrap();
    Ok(())
}
