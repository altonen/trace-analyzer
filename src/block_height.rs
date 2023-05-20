use chrono::NaiveTime;
use gnuplot::{Caption, Color, Figure};
use plotters::prelude::*;
use regex::{Regex, RegexSet};

use std::{
    collections::{hash_map::Entry, HashMap, HashSet},
    error::Error,
    fs::File,
    io::{prelude::*, BufReader, BufWriter, Write},
};

fn export(filename: &str, data: Vec<String>) -> Result<(), Box<dyn Error>> {
    let file = File::create(filename)?;
    let mut writer = BufWriter::new(file);

    for line in data {
        writer.write_all(line.as_bytes())?;
    }

    writer.flush()?;

    Ok(())
}

#[derive(Debug, Default)]
struct PeerInfo {
    sent_requests: usize,
    received_responses: usize,
    disconnected: usize,
    connected: usize,
    evicted: usize,
}

#[derive(Debug, Default)]
struct NetworkInfo {
    sent_requests: usize,
    received_responses: usize,
    disconnected: usize,
    connected: usize,
    evicted: usize,
}

pub fn analyze_block_height(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
    let set = RegexSet::new(&[
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*\((\d+) peers\).*best: #(\d+).*finalized #(\d+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Pre-validating received.*with number (\d+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Header ([^\s]+) has (\d+) logs",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Block imported successfully Some\(\d+\) \(([^\s]+)\).*",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*New block request for ([a-zA-Z0-9]+).*Number\((\d+)\).*",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*BlockResponse 0 from ([a-zA-Z0-9]+).*\((\d+)\.\.(\d+)\).*",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Connected ([a-zA-Z0-9]+).*",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*(12[a-zA-Z0-9]+) disconnected.*",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*evict peer ([a-zA-Z0-9]+).*",
    ])
    .unwrap();
    let regexes: Vec<_> = set
        .patterns()
        .iter()
        .map(|pat| Regex::new(pat).unwrap())
        .collect();

    let mut peer_info = HashMap::new();
    let mut network_info = NetworkInfo::default();
    let mut pending_block_imports = HashMap::new();
    let mut peers = vec![String::from("date,value\n")];
    let mut block_heights = vec![String::from("date,best,finalized\n")];
    let mut import_times = vec![String::from("duration\n")];
    let mut block_announcements = vec![String::from("date,value\n")];
    let mut sent_requests = vec![String::from("date,value\n")];

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
                peers.push(format!("{},{}\n", &captures[2], &captures[3]));
                block_heights.push(format!(
                    "{},{},{}\n",
                    &captures[2], &captures[4], &captures[5],
                ));
            }
            1 => {
                block_announcements.push(format!("{},{}\n", &captures[2], &captures[3]));
            }
            2 => {
                pending_block_imports.insert(captures[3].to_owned(), captures[2].to_owned());
            }
            3 => {
                if let Some(time) = pending_block_imports.remove(&captures[3]) {
                    let time1 = NaiveTime::parse_from_str(&time, "%H:%M:%S%.3f").unwrap();
                    let time2 = NaiveTime::parse_from_str(&captures[2], "%H:%M:%S%.3f").unwrap();
                    import_times.push(format!(
                        "{}\n",
                        time2.signed_duration_since(time1).num_milliseconds()
                    ));
                }
            }
            4 => {
                sent_requests.push(format!("{},{}\n", &captures[2], &captures[3]));
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.sent_requests += 1;
                network_info.sent_requests += 1;
            }
            5 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.received_responses += 1;
                network_info.received_responses += 1;
            }
            6 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.connected += 1;
                network_info.connected += 1;
            }
            7 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.connected += 1;
                network_info.disconnected += 1;
            }
            8 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.evicted += 1;
                network_info.evicted += 1;
            }
            _ => {
                println!("{captures:?}");
            }
        }
    }

    export("peers.csv", peers).unwrap();
    export("block_info.csv", block_heights).unwrap();
    export("block_import_times.csv", import_times).unwrap();
    export("block_announcements.csv", block_announcements).unwrap();

    println!("{:#?}", peer_info);
    println!("{:#?}", network_info);
    // println!("{:#?}", block_announcements);
    // println!("{:#?}", block_heights);

    Ok(())
}
