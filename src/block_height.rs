use chrono::NaiveTime;
use gnuplot::{Caption, Color, Figure};
use plotters::prelude::*;
use regex::{Regex, RegexSet};
use serde::Serialize;

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
struct ProtocolInfo {
    messages_sent: usize,
    messages_received: usize,
    bytes_received: usize,
    bytes_sent: usize,
}

#[derive(Debug, Default)]
struct PeerInfo {
    sent_requests: usize,
    received_responses: usize,
    dialed: usize,
    failed_to_reach: usize,
    sync_connected: usize,
    sync_disconnected: usize,
    evicted: usize,
    connected: usize,
    disconnected: usize,
    protocols: HashMap<String, ProtocolInfo>,
}

#[derive(Debug, Default)]
struct ConnectionInfo {
    unique_dials: HashSet<String>,
    unique_conns: HashSet<String>,
    dialed: usize,
    failed_to_reach: usize,
    connected: usize,
    disconnected: usize,
}

#[derive(Debug, Default)]
struct NetworkInfo {
    discovered_peers: usize,
    sent_requests: usize,
    received_responses: usize,
    disconnected: usize,
    connected: usize,
    evicted: usize,
    protocols: HashMap<String, ProtocolInfo>,
}

#[derive(Debug, Default, Serialize)]
struct ConnectionRole {
    dialer: usize,
    listener: usize,
}

#[derive(Debug, Default, Serialize)]
struct AddressType {
    dns: usize,
    ip4: usize,
    ip6: usize,
}

#[derive(Debug, Default)]
struct SubstreamOpenInfo {
    success: usize,
    failure: usize,
}

fn string_to_protocol(string: &str) -> String {
    if string.contains("grandpa") {
        return String::from("grandpa");
    }

    if string.contains("block-announce") {
        return String::from("block-announces");
    }

    panic!("invalid protocol {string}");
}

fn set_id_to_protocol(string: &str) -> String {
    match string {
        "0" => String::from("block-announces"),
        "1" => String::from("transactions"),
        "2" => String::from("grandpa"),
        _ => panic!("invalid set id"),
    }
}

pub fn analyze_block_height(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
    let set = RegexSet::new(&[
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*\((\d+) peers\).*best: #(\d+).*finalized #(\d+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Pre-validating received.*with number (\d+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Header ([^\s]+) has (\d+) logs",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Block imported successfully Some\(\d+\) \(([^\s]+)\)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*New (gap )?block request for ([a-zA-Z0-9]+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*BlockResponse 0 from ([a-zA-Z0-9]+).*\((\d+)\.\.(\d+)\)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Connected ([a-zA-Z0-9]+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*(12[a-zA-Z0-9]+) disconnected",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*evict peer ([a-zA-Z0-9]+)",
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Handler\(ConnectionId\(\d+\)\).*Notification\(([a-zA-Z0-9]+), SetId\((\d+)\), (\d+) bytes",
        r#"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*External API.*Notification\(PeerId.*([a-zA-Z0-9]+)\"\), OnHeap\(\"([^"]+)\"\), (\d+) bytes"#,
        r#"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Libp2p.*Dialing[^"]+\"([a-zA-Z0-9]+)"#,
        r#"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Libp2p.*Failed to reach PeerId.*([a-zA-Z0-9]+)"#,
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Libp2p.*Connected\(([a-zA-Z0-9]+), SetId\((\d+)\), ([a-zA-Z]+).*address: .*(dns|ip4|ip6)",
        r#"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Libp2p.*Disconnected\(PeerId.*([a-zA-Z0-9]+)"#,
        r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Handler\(([a-zA-Z0-9]+).*ConnectionId\((\d+)\)\).*OpenResultOk\(SetId\((\d+)\)\)",
        r#"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}.\d{3}).*Handler\(PeerId[^"]+\"([a-zA-Z0-9]+).*ConnectionId\((\d+)\)\).*OpenResultErr\(SetId\((\d+)\)\)"#,
    ])
    .unwrap();
    let regexes: Vec<_> = set
        .patterns()
        .iter()
        .map(|pat| Regex::new(pat).unwrap())
        .collect();

    let mut peer_info = HashMap::new();
    let mut network_info = NetworkInfo::default();
    let mut conn_info = ConnectionInfo::default();

    let mut roles = ConnectionRole::default();
    let mut addresses = AddressType::default();
    let mut pending_block_imports = HashMap::new();
    let mut peers = vec![String::from("date,value\n")];
    let mut block_heights = vec![String::from("date,best,finalized\n")];
    let mut import_times = vec![String::from("duration\n")];
    let mut block_announcements = vec![String::from("date,value\n")];
    let mut sent_requests = vec![String::from("date,value\n")];
    let mut protocol_send_byte_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut protocol_recv_byte_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut protocol_recv_msg_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut protocol_send_msg_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];

    let mut block_announce_substream = SubstreamOpenInfo::default();
    let mut transaction_substream = SubstreamOpenInfo::default();
    let mut grandpa_substream = SubstreamOpenInfo::default();

    let mut current_time = None;
    let mut current_protocol_info: HashMap<String, ProtocolInfo> = HashMap::new();

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

        if current_time.is_none() {
            let time = captures[2].to_string();
            current_time = Some(time);
        }

        let time1 =
            NaiveTime::parse_from_str(current_time.as_ref().unwrap(), "%H:%M:%S%.3f").unwrap();
        let time2 = NaiveTime::parse_from_str(&captures[2], "%H:%M:%S%.3f").unwrap();

        if time2.signed_duration_since(time1).num_milliseconds() > 15_000 {
            if !current_protocol_info.is_empty() {
                protocol_send_byte_usage.push(format!(
                    "{},{},{},{}\n",
                    time1,
                    current_protocol_info
                        .get("block-announces")
                        .map_or(0, |info| info.bytes_sent),
                    current_protocol_info
                        .get("grandpa")
                        .map_or(0, |info| info.bytes_sent),
                    current_protocol_info
                        .get("transactions")
                        .map_or(0, |info| info.bytes_sent),
                ));

                protocol_send_msg_usage.push(format!(
                    "{},{},{},{}\n",
                    time1,
                    current_protocol_info
                        .get("block-announces")
                        .map_or(0, |info| info.messages_sent),
                    current_protocol_info
                        .get("grandpa")
                        .map_or(0, |info| info.messages_sent),
                    current_protocol_info
                        .get("transactions")
                        .map_or(0, |info| info.messages_sent),
                ));

                protocol_recv_byte_usage.push(format!(
                    "{},{},{},{}\n",
                    time1,
                    current_protocol_info
                        .get("block-announces")
                        .map_or(0, |info| info.bytes_received),
                    current_protocol_info
                        .get("grandpa")
                        .map_or(0, |info| info.bytes_received),
                    current_protocol_info
                        .get("transactions")
                        .map_or(0, |info| info.bytes_received),
                ));

                protocol_recv_msg_usage.push(format!(
                    "{},{},{},{}\n",
                    time1,
                    current_protocol_info
                        .get("block-announces")
                        .map_or(0, |info| info.messages_received),
                    current_protocol_info
                        .get("grandpa")
                        .map_or(0, |info| info.messages_received),
                    current_protocol_info
                        .get("transactions")
                        .map_or(0, |info| info.messages_received),
                ));

                current_protocol_info.clear();
            }

            let time = captures[2].to_string();
            current_time = Some(time);
        }

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
                let peer = match captures.get(3) {
                    Some(peer) => peer.as_str().to_owned(),
                    None => captures[4].to_string(),
                };

                sent_requests.push(format!("{},{}\n", &captures[2], peer));
                let mut entry: &mut PeerInfo = peer_info.entry(peer).or_default();
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
                entry.sync_connected += 1;
                network_info.connected += 1;
            }
            7 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.sync_disconnected += 1;
                network_info.disconnected += 1;
            }
            8 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();
                entry.evicted += 1;
                network_info.evicted += 1;
            }
            9 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();

                entry
                    .protocols
                    .entry(set_id_to_protocol(&captures[4]))
                    .or_default()
                    .bytes_received += captures[5].parse::<usize>().unwrap();

                network_info
                    .protocols
                    .entry(set_id_to_protocol(&captures[4]))
                    .or_default()
                    .bytes_received += captures[5].parse::<usize>().unwrap();

                let mut entry = current_protocol_info
                    .entry(set_id_to_protocol(&captures[4]))
                    .or_default();
                entry.bytes_received += captures[5].parse::<usize>().unwrap();
                entry.messages_received += 1;
            }
            10 => {
                let mut entry: &mut PeerInfo =
                    peer_info.entry(captures[3].to_string()).or_default();

                entry
                    .protocols
                    .entry(string_to_protocol(&captures[4]))
                    .or_default()
                    .bytes_sent += captures[5].parse::<usize>().unwrap();

                network_info
                    .protocols
                    .entry(string_to_protocol(&captures[4]))
                    .or_default()
                    .bytes_sent += captures[5].parse::<usize>().unwrap();

                let mut entry = current_protocol_info
                    .entry(string_to_protocol(&captures[4]))
                    .or_default();
                entry.bytes_sent += captures[5].parse::<usize>().unwrap();
                entry.messages_sent += 1;
            }
            11 => {
                conn_info.dialed += 1;
                conn_info.unique_dials.insert(captures[3].to_string());
                peer_info.entry(captures[3].to_string()).or_default().dialed += 1;
            }
            12 => {
                peer_info
                    .entry(captures[3].to_string())
                    .or_default()
                    .failed_to_reach += 1;
                conn_info.failed_to_reach += 1;
            }
            13 => {
                match &captures[5] {
                    "Dialer" => roles.dialer += 1,
                    "Listener" => roles.listener += 1,
                    _ => {
                        println!("unrecognized role {:?}", &captures[4]);
                    }
                }

                match &captures[6] {
                    "dns" => addresses.dns += 1,
                    "ip4" => addresses.ip4 += 1,
                    "ip6" => addresses.ip6 += 1,
                    _ => {}
                }

                peer_info
                    .entry(captures[3].to_string())
                    .or_default()
                    .connected += 1;
                conn_info.unique_conns.insert(captures[3].to_string());
                conn_info.connected += 1;
            }
            14 => {
                peer_info
                    .entry(captures[3].to_string())
                    .or_default()
                    .disconnected += 1;
                conn_info.disconnected += 1;
            }
            15 => match &captures[5] {
                "0" => block_announce_substream.success += 1,
                "1" => transaction_substream.success += 1,
                "2" => grandpa_substream.success += 1,
                _ => {}
            },
            16 => match &captures[5] {
                "0" => block_announce_substream.failure += 1,
                "1" => transaction_substream.failure += 1,
                "2" => grandpa_substream.failure += 1,
                _ => {}
            },
            _ => {
                println!("{captures:?}");
            }
        }
    }

    if !current_protocol_info.is_empty() {
        protocol_send_byte_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("block-announces")
                .map_or(0, |info| info.bytes_sent),
            current_protocol_info
                .get("grandpa")
                .map_or(0, |info| info.bytes_sent),
            current_protocol_info
                .get("transactions")
                .map_or(0, |info| info.bytes_sent),
        ));

        protocol_send_msg_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("block-announces")
                .map_or(0, |info| info.messages_sent),
            current_protocol_info
                .get("grandpa")
                .map_or(0, |info| info.messages_sent),
            current_protocol_info
                .get("transactions")
                .map_or(0, |info| info.messages_sent),
        ));

        protocol_recv_byte_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("block-announces")
                .map_or(0, |info| info.bytes_received),
            current_protocol_info
                .get("grandpa")
                .map_or(0, |info| info.bytes_received),
            current_protocol_info
                .get("transactions")
                .map_or(0, |info| info.bytes_received),
        ));

        protocol_recv_msg_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("block-announces")
                .map_or(0, |info| info.messages_received),
            current_protocol_info
                .get("grandpa")
                .map_or(0, |info| info.messages_received),
            current_protocol_info
                .get("transactions")
                .map_or(0, |info| info.messages_received),
        ));
    }

    export("peers.csv", peers).unwrap();
    export("block_info.csv", block_heights).unwrap();
    export("block_import_times.csv", import_times).unwrap();
    export("block_announcements.csv", block_announcements).unwrap();
    export("bytes_sent.csv", protocol_send_byte_usage).unwrap();
    export("bytes_received.csv", protocol_recv_byte_usage).unwrap();
    export("messages_received.csv", protocol_recv_msg_usage).unwrap();
    export("messages_sent.csv", protocol_send_msg_usage).unwrap();

    println!("{:#?}", network_info);
    println!("dialed {}, failed to reach {}, connected {}, disconnected {}, unique dials {}, unique conns {}",
        conn_info.dialed,
        conn_info.failed_to_reach,
        conn_info.connected,
        conn_info.disconnected,
        conn_info.unique_dials.len(),
        conn_info.unique_conns.len(),
    );

    #[derive(Debug, Default, Serialize)]
    struct JsonConnectionInfo {
        unique_dials: usize,
        unique_connections: usize,
        failed_to_reach: usize,
        disconnected: usize,
    }

    let json = serde_json::to_string(&JsonConnectionInfo {
        unique_dials: conn_info.unique_dials.len(),
        unique_connections: conn_info.unique_conns.len(),
        failed_to_reach: conn_info.failed_to_reach,
        disconnected: conn_info.disconnected,
    })
    .unwrap();

    let file = File::create("connectivity.json")?;
    let mut writer = BufWriter::new(file);
    writer.write_all(json.as_bytes())?;
    writer.flush()?;

    let json = serde_json::to_string(&roles).unwrap();
    let file = File::create("roles.json")?;
    let mut writer = BufWriter::new(file);
    writer.write_all(json.as_bytes())?;
    writer.flush()?;

    let json = serde_json::to_string(&addresses).unwrap();
    let file = File::create("addresses.json")?;
    let mut writer = BufWriter::new(file);
    writer.write_all(json.as_bytes())?;
    writer.flush()?;

    let mut substream_info = format!(
        "group,success,failure\nblock-announces,{},{}\ntransactions,{},{}\ngrandpa,{},{}\n",
        block_announce_substream.success,
        block_announce_substream.failure,
        transaction_substream.success,
        transaction_substream.failure,
        grandpa_substream.success,
        grandpa_substream.failure,
    );
    let file = File::create("substreams.csv")?;
    let mut writer = BufWriter::new(file);
    writer.write_all(substream_info.as_bytes())?;
    writer.flush()?;

    Ok(())
}
