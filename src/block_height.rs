use regex::Regex;
use std::error::Error;
use std::fs::File;
use std::io::{prelude::*, BufReader};

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

    for block_height in block_heights {
        println!(
            "{}: best {} finalized {}",
            block_height.time, block_height.best, block_height.finalized
        );
    }

    Ok(())
}
