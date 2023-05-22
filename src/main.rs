#![allow(unused)]

use chrono::NaiveTime;
use clap::Parser;
use rayon::prelude::*;
use regex::{Regex, RegexSet};
use serde::Serialize;

use std::{
    collections::{HashMap, HashSet},
    error::Error,
    fs::File,
    io::{self, BufRead, BufReader, BufWriter, Write},
};

#[derive(Parser)]
struct Flags {
    #[clap(long)]
    file: String,
}

#[derive(Debug, Default)]
struct ProtocolInfo {
    messages_sent: usize,
    messages_received: usize,
    bytes_received: usize,
    bytes_sent: usize,
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

#[derive(Debug)]
struct Delta {
    time: NaiveTime,
    delta: DeltaType,
}

#[derive(Debug)]
enum Role {
    Dialer,
    Listener,
}

#[derive(Debug)]
enum Address {
    Dns,
    Ip4,
    Ip6,
}

#[derive(Debug, Default)]
struct SyncInfo {
    connected: usize,
    connected_unique: HashSet<String>,
    disconnected: usize,
    disconnected_unique: HashSet<String>,
    evicted: usize,
    evicted_unique: HashSet<String>,
}

#[derive(Debug)]
enum DeltaType {
    PeerCount(String),
    BlockHeight(String),
    BlockAnnounce(String),
    BlockImportStarted(String),
    BlockImportFinished(String),
    BlockRequestSent(String),
    BlockResponseReceived(String),
    SyncConnected(String),
    SyncDisconnected(String),
    Evicted(String),
    BytesReceived(String, String, usize),
    BytesSent(String, String, usize),
    Dialed(String),
    FailedToReach(String),
    Connected(Role, Address, String),
    Disconnected(String),
    SubstreamOpenSuccess(usize),
    SubstreamOpenFailure(usize),
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

fn process_line<'a>(line: &'a str, set: &RegexSet, regexes: &Vec<Regex>) -> Vec<Delta> {
    let matches = set
        .matches(&line)
        .into_iter()
        .map(|match_idx| (match_idx, &regexes[match_idx]))
        .map(|(idx, pat)| (idx, pat.captures(&line).unwrap()))
        .collect::<Vec<_>>();

    if matches.is_empty() || matches.len() > 1 {
        return vec![];
    }

    let (index, captures) = &matches[0];

    let mut deltas = Vec::new();
    let time = NaiveTime::parse_from_str(&captures[2], "%H:%M:%S%.3f").unwrap();

    match index {
        0 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::PeerCount(format!("{},{}\n", &captures[2], &captures[3])),
            });
            deltas.push(Delta {
                time,
                delta: DeltaType::BlockHeight(format!(
                    "{},{},{}\n",
                    &captures[2], &captures[4], &captures[5]
                )),
            })
        }
        1 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::BlockAnnounce(format!("{},{}\n", &captures[2], &captures[3])),
            });
        }
        2 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::BlockImportStarted(captures[3].to_owned()),
            });
        }
        3 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::BlockImportFinished(captures[3].to_owned()),
            });
        }
        4 => {
            let peer = match captures.get(3) {
                Some(peer) => peer.as_str().to_owned(),
                None => captures[4].to_string(),
            };

            deltas.push(Delta {
                time,
                delta: DeltaType::BlockRequestSent(peer),
            });
        }
        5 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::BlockResponseReceived(captures[3].to_string()),
            });
        }
        6 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::SyncConnected(captures[3].to_string()),
            });
        }
        7 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::SyncDisconnected(captures[3].to_string()),
            });
        }
        8 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::Evicted(captures[3].to_string()),
            });
        }
        9 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::BytesReceived(
                    captures[3].to_string(),
                    captures[4].to_string(),
                    captures[5].parse::<usize>().unwrap(),
                ),
            });
        }
        10 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::BytesSent(
                    captures[3].to_string(),
                    captures[4].to_string(),
                    captures[5].parse::<usize>().unwrap(),
                ),
            });
        }
        11 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::Dialed(captures[3].to_string()),
            });
        }
        12 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::FailedToReach(captures[3].to_string()),
            });
        }
        13 => {
            let role = match &captures[5] {
                "Dialer" => Role::Dialer,
                "Listener" => Role::Listener,
                role => panic!("unrecognized role {role:?}"),
            };

            let address = match &captures[6] {
                "dns" => Address::Dns,
                "ip4" => Address::Ip4,
                "ip6" => Address::Ip6,
                address => panic!("invalid address {address:?}"),
            };

            deltas.push(Delta {
                time,
                delta: DeltaType::Connected(role, address, captures[3].to_string()),
            });
        }
        14 => {
            deltas.push(Delta {
                time,
                delta: DeltaType::Disconnected(captures[3].to_string()),
            });
        }
        15 => {
            let substream = match &captures[5] {
                "0" => 0,
                "1" => 1,
                "2" => 2,
                substream => panic!("invalid substream {substream:?}"),
            };

            deltas.push(Delta {
                time,
                delta: DeltaType::SubstreamOpenSuccess(substream),
            });
        }
        16 => {
            let substream = match &captures[5] {
                "0" => 0,
                "1" => 1,
                "2" => 2,
                substream => panic!("invalid substream {substream:?}"),
            };

            deltas.push(Delta {
                time,
                delta: DeltaType::SubstreamOpenFailure(substream),
            });
        }
        _ => {}
    }

    deltas
}

fn analyze_optimized(reader: BufReader<File>) -> Result<(), Box<dyn Error>> {
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

    let mut deltas = reader
        .lines()
        .collect::<Vec<_>>()
        .par_iter()
        .map(|line| {
            if let Ok(line) = line {
                process_line(&line, &set, &regexes)
            } else {
                vec![]
            }
        })
        .flatten()
        .collect::<Vec<_>>();

    deltas.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());

    let mut pending_block_imports = HashMap::new();
    let mut peers = vec![String::from("date,value\n")];
    let mut block_heights = vec![String::from("date,best,finalized\n")];
    let mut import_times = vec![String::from("duration\n")];
    let mut block_announcements = vec![String::from("date,value\n")];
    let mut protocol_send_byte_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut protocol_recv_byte_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut protocol_recv_msg_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut protocol_send_msg_usage =
        vec![String::from("date,block-announces,grandpa,transactions\n")];
    let mut conn_info = ConnectionInfo::default();

    let mut block_announce_substream = SubstreamOpenInfo::default();
    let mut transaction_substream = SubstreamOpenInfo::default();
    let mut grandpa_substream = SubstreamOpenInfo::default();

    let mut current_time = None;
    let mut current_protocol_info: HashMap<String, ProtocolInfo> = HashMap::new();
    let mut roles = ConnectionRole::default();
    let mut addresses = AddressType::default();
    let mut sync_info = SyncInfo::default();

    for delta in deltas {
        if current_time.is_none() {
            current_time = Some(delta.time);
        }

        if delta
            .time
            .signed_duration_since(*current_time.as_ref().unwrap())
            .num_milliseconds()
            > 15_000
        {
            if !current_protocol_info.is_empty() {
                protocol_send_byte_usage.push(format!(
                    "{},{},{},{}\n",
                    *current_time.as_ref().unwrap(),
                    current_protocol_info
                        .get("0")
                        .map_or(0, |info| info.bytes_sent),
                    current_protocol_info
                        .get("2")
                        .map_or(0, |info| info.bytes_sent),
                    current_protocol_info
                        .get("1")
                        .map_or(0, |info| info.bytes_sent),
                ));

                protocol_send_msg_usage.push(format!(
                    "{},{},{},{}\n",
                    *current_time.as_ref().unwrap(),
                    current_protocol_info
                        .get("0")
                        .map_or(0, |info| info.messages_sent),
                    current_protocol_info
                        .get("2")
                        .map_or(0, |info| info.messages_sent),
                    current_protocol_info
                        .get("1")
                        .map_or(0, |info| info.messages_sent),
                ));

                protocol_recv_byte_usage.push(format!(
                    "{},{},{},{}\n",
                    *current_time.as_ref().unwrap(),
                    current_protocol_info
                        .get("0")
                        .map_or(0, |info| info.bytes_received),
                    current_protocol_info
                        .get("2")
                        .map_or(0, |info| info.bytes_received),
                    current_protocol_info
                        .get("1")
                        .map_or(0, |info| info.bytes_received),
                ));

                protocol_recv_msg_usage.push(format!(
                    "{},{},{},{}\n",
                    *current_time.as_ref().unwrap(),
                    current_protocol_info
                        .get("0")
                        .map_or(0, |info| info.messages_received),
                    current_protocol_info
                        .get("2")
                        .map_or(0, |info| info.messages_received),
                    current_protocol_info
                        .get("1")
                        .map_or(0, |info| info.messages_received),
                ));

                current_protocol_info.clear();
                current_time = Some(delta.time);
            }
        }

        match delta.delta {
            DeltaType::PeerCount(peer_count) => {
                peers.push(peer_count);
            }
            DeltaType::BlockHeight(block_height) => {
                block_heights.push(block_height);
            }
            DeltaType::BlockAnnounce(block_announcement) => {
                block_announcements.push(block_announcement);
            }
            DeltaType::BlockImportStarted(hash) => {
                pending_block_imports.insert(hash, delta.time);
            }
            DeltaType::BlockImportFinished(hash) => {
                if let Some(start_time) = pending_block_imports.remove(&hash) {
                    import_times.push(format!(
                        "{}\n",
                        delta
                            .time
                            .signed_duration_since(start_time)
                            .num_milliseconds()
                    ));
                }
            }
            // DeltaType::BlockRequestSent(String) => {
            //     todo!();
            // }
            // DeltaType::BlockResponseReceived(String) => {
            //     todo!();
            // }
            DeltaType::SyncConnected(peer) => {
                sync_info.connected += 1;
                sync_info.connected_unique.insert(peer);
            }
            DeltaType::SyncDisconnected(peer) => {
                sync_info.disconnected += 1;
                sync_info.disconnected_unique.insert(peer);
            }
            DeltaType::Evicted(peer) => {
                sync_info.evicted += 1;
                sync_info.evicted_unique.insert(peer);
            }
            DeltaType::BytesReceived(peer, protocol, received) => {
                let mut entry = current_protocol_info.entry(protocol).or_default();
                entry.bytes_received += received;
                entry.messages_received += 1;
            }
            DeltaType::BytesSent(peer, protocol, sent) => {
                let mut entry = current_protocol_info.entry(protocol).or_default();
                entry.bytes_sent += sent;
                entry.messages_sent += 1;
            }
            DeltaType::Dialed(peer) => {
                conn_info.dialed += 1;
                conn_info.unique_dials.insert(peer);
            }
            DeltaType::FailedToReach(_peer) => {
                conn_info.failed_to_reach += 1;
            }
            DeltaType::Connected(role, address, peer) => {
                match role {
                    Role::Dialer => roles.dialer += 1,
                    Role::Listener => roles.listener += 1,
                }

                match address {
                    Address::Dns => addresses.dns += 1,
                    Address::Ip4 => addresses.ip4 += 1,
                    Address::Ip6 => addresses.ip6 += 1,
                }

                conn_info.unique_conns.insert(peer);
                conn_info.connected += 1;
            }
            DeltaType::Disconnected(_peer) => {
                conn_info.disconnected += 1;
            }
            DeltaType::SubstreamOpenSuccess(protocol) => match protocol {
                0 => block_announce_substream.success += 1,
                1 => transaction_substream.success += 1,
                2 => grandpa_substream.success += 1,
                _ => {}
            },
            DeltaType::SubstreamOpenFailure(protocol) => match protocol {
                0 => block_announce_substream.failure += 1,
                1 => transaction_substream.failure += 1,
                2 => grandpa_substream.failure += 1,
                _ => {}
            },
            _ => {}
        }
    }

    if !current_protocol_info.is_empty() {
        protocol_send_byte_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("0")
                .map_or(0, |info| info.bytes_sent),
            current_protocol_info
                .get("2")
                .map_or(0, |info| info.bytes_sent),
            current_protocol_info
                .get("1")
                .map_or(0, |info| info.bytes_sent),
        ));

        protocol_send_msg_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("0")
                .map_or(0, |info| info.messages_sent),
            current_protocol_info
                .get("2")
                .map_or(0, |info| info.messages_sent),
            current_protocol_info
                .get("1")
                .map_or(0, |info| info.messages_sent),
        ));

        protocol_recv_byte_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("0")
                .map_or(0, |info| info.bytes_received),
            current_protocol_info
                .get("2")
                .map_or(0, |info| info.bytes_received),
            current_protocol_info
                .get("1")
                .map_or(0, |info| info.bytes_received),
        ));

        protocol_recv_msg_usage.push(format!(
            "{},{},{},{}\n",
            current_time.as_ref().unwrap(),
            current_protocol_info
                .get("0")
                .map_or(0, |info| info.messages_received),
            current_protocol_info
                .get("2")
                .map_or(0, |info| info.messages_received),
            current_protocol_info
                .get("1")
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

    #[derive(Debug, Default, Serialize)]
    struct JsonSyncInfo {
        connected: usize,
        connected_unique: usize,
        disconnected: usize,
        disconnected_unique: usize,
        evicted: usize,
        evicted_unique: usize,
    }

    let mut substream_info = format!(
        "group,total,unique\nconnected,{},{}\ndisconnected,{},{}\nevicted,{},{}\n",
        sync_info.connected,
        sync_info.connected_unique.len(),
        sync_info.disconnected,
        sync_info.disconnected_unique.len(),
        sync_info.evicted,
        sync_info.evicted_unique.len(),
    );
    let file = File::create("sync_connectivity.csv")?;
    let mut writer = BufWriter::new(file);
    writer.write_all(substream_info.as_bytes())?;
    writer.flush()?;

    let file = File::create("sync.json")?;
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

fn main() -> io::Result<()> {
    let flags = Flags::parse();
    let file = File::open(flags.file)?;
    let reader = BufReader::new(file);

    analyze_optimized(reader).unwrap();

    Ok(())
}
