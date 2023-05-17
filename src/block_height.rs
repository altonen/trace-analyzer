use regex::Regex;
use std::error::Error;
use std::fs::File;
use std::io::{prelude::*, BufReader};

pub fn analyze_block_height(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
    // let re = Regex::new(r"target=#(\d+).*best: #(\d+).*finalized #(\d+)").unwrap();
    // let re = Regex::new(r"r'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*target=#(\d+).*best: #(\d+).*finalized #(\d+)'").unwrap();
    let re = Regex::new(r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*target=#(\d+).*best: #(\d+).*finalized #(\d+)").unwrap();

    for line in reader.lines() {
        let line = line?;

        match re.captures(&line) {
            None => {
                continue;
            }
            Some(captures) => {
                // if captures.len() != 4 {
                //     continue;
                // }

                println!("{:?}", &captures[2]);

                // println!(
                //     "target {}, best {}, finalize {}",
                //     &captures[1], &captures[2], &captures[3]
                // );
            }
        }
    }

    Ok(())
}
