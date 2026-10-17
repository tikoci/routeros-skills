# WebFig fragment catalog and discovery

## Contents

- [Use the catalog](#use-the-catalog)
- [Discover a view on the target](#discover-a-view-on-the-target)
- [CMR](#cmr)
- [Ungrouped](#ungrouped)
- [IP](#ip)
- [IPv6](#ipv6)
- [System](#system)
- [Routing](#routing)
- [MPLS](#mpls)
- [Switch](#switch)
- [Tools](#tools)

## Use the catalog

This is a **structural catalog**, not a list of verified or safe navigation
endpoints. It retains a 7.24.5 menu-name extraction grounded by the
[independent validation](validation.md), which checked a subset in the browser
and compared names with the authenticated app's menu metadata.

The definitions include tables, forms, hidden dialogs, actions and hardware
variants. Some entries collide; package/hardware predicates, policy and skins
control availability. For example, this CHR did not expose the OpenFlow entries
in its app metadata. A fragment can silently open another page when its target
is unavailable. Do not call all catalog entries addressable views.

Known `doit`, `action`, `alias` and `termopen` containers from the inspected app
metadata are marked below. **Unmarked does not mean browser-tested or safe.**
Do not bulk-navigate this catalog: `container.doit.createPane()` can dispatch
commands on opening, and aliases can start another container. Use the short
verified view table in [SKILL.md](../SKILL.md) for normal human review links.

## Discover a view on the target

1. Log in to the router's actual WebFig UI.
2. Navigate through its menus and select the required tab.
3. Copy the address bar URL; confirm the rendered title/tab matches the intent.
4. For a particular object, open its existing row and copy that resulting URL.
   Keep object suffixes specific to that router and current object.

The grammar is `#Group:Service.Container.Object` (with the group, container and object optional).
The source's `normalize()` replaces whitespace and dots in service/container
names with underscores. Do not translate CLI paths mechanically. Additional
components have container-specific semantics; they are not universally ignored.

Special applets found in the HTML/JS are `#Quick_Set`, `#WebFig`, `#Terminal`,
`#SkinDesigner` and `#About`. Availability and default applet depend on the user
and router. `#Terminal` gives a CLI, not a read-only review page.
`#SkinDesigner` edits WebFig skins: JSON files at `skins/<name>.json` where
`0` hides a menu entry (except `order`), `{tab: "name"}` renames a tab, and
per-item fields carry rename/note/limit/read-only/hide flags. Skins attach to
a user **group** (`/user/group set <group> skin=<skin>`, verified live), not to
an individual user. A skin only reshapes menus; it never grants or removes
rights — enforcement stays with group policies and the CLI.

## CMR

CMR links are version- and package-dependent. Use **routeros-cmr** for the
7.26beta1 controller package and client configuration. Do not infer controller
support from an older bundle merely containing CMR-related menu definitions.
The 7.26beta1 results are recorded in [validation.md](validation.md).

| Location | Fragment | Evidence on 7.26beta1 |
|---|---|---|
| Controller dashboard | `#CMR_Dashboard.Dashboard` | Rendered in Chrome |
| Controller devices | `#CMR_Devices.Devices` | Rendered in Chrome |
| Local CMR client | `#System:CMR_Client` | Rendered in Chrome |
| Controller ports | `#CMR_Ports` | Menu link observed; view not opened |
| Controller WiFi | `#CMR_WiFi` | Menu link observed; view not opened |
| Controller topology | `#CMR_Topology` | Menu link observed; view not opened |
| Controller alerts | `#CMR_Alerts` | Menu link observed; view not opened |
| Controller VLAN rules | `#CMR_VLAN_Rules` | Menu link observed; view not opened |
| Controller traffic | `#CMR_Traffic` | Menu link observed; view not opened |
| Controller settings | `#CMR_Settings` | Menu link observed; view not opened |

The controller applet changes the side menu to these CMR sections. The local
client remains under System in the normal WebFig menu. A controller package was
installed for these checks, but no controller was enabled or fleet paired.

## Ungrouped

- `#About` — About
  - `#About.About` — About
- `#BTRFS` — BTRFS
  - `#BTRFS.BTRFS` — BTRFS
  - `#BTRFS.Add_Device` — Add Device **(doit; not a review view)**
  - `#BTRFS.Remove_Device` — Remove Device **(doit; not a review view)**
  - `#BTRFS.Replace_Device` — Replace Device **(doit; not a review view)**
  - `#BTRFS.Balance_Start` — Balance Start **(doit; not a review view)**
  - `#BTRFS.Subvolume` — Subvolume
  - `#BTRFS.Transfer` — Transfer
- `#Bridge` — Bridge
  - `#Bridge.Bridge` — Bridge
  - `#Bridge.Settings` — Settings
  - `#Bridge.Ports` — Ports
  - `#Bridge.VLANs` — VLANs
  - `#Bridge.MSTIs` — MSTIs
  - `#Bridge.Port_MST_Overrides` — Port MST Overrides
  - `#Bridge.MVRP_Attributes` — MVRP Attributes
  - `#Bridge.Filters` — Filters
  - `#Bridge.NAT` — NAT
  - `#Bridge.Hosts` — Hosts
  - `#Bridge.MDB` — MDB
- `#Dot1X` — Dot1X
  - `#Dot1X.Client` — Client
  - `#Dot1X.Server` — Server
  - `#Dot1X.State` — State
  - `#Dot1X.Active` — Active
- `#Files` — Files
  - `#Files.File` — File
  - `#Files.Text_File` — Text File
  - `#Files.Directory` — Directory
  - `#Files.Store` — Store
  - `#Files.Package` — Package
  - `#Files.Backup` — Backup
  - `#Files.Script` — Script
  - `#Files.Support_Info` — Support Info
  - `#Files.SSH_Key` — SSH Key
  - `#Files.File` — File
  - `#Files.Text_File` — Text File
  - `#Files.Directory` — Directory
  - `#Files.Store` — Store
  - `#Files.Package` — Package
  - `#Files.Backup` — Backup
  - `#Files.Script` — Script
  - `#Files.Support_Info` — Support Info
  - `#Files.SSH_Key` — SSH Key
  - `#Files.Backup_Config` — Backup Config **(doit; not a review view)**
  - `#Files.Restore` — Restore **(doit; not a review view)**
  - `#Files.Share` — Share **(action; not a review view)**
  - `#Files.Unshare` — Unshare **(doit; not a review view)**
  - `#Files.Cloud_Backup` — Cloud Backup
  - `#Files.Upload_Backup` — Upload Backup **(action; not a review view)**
  - `#Files.Download_Backup` — Download Backup **(action; not a review view)**
  - `#Files.Remove_Backup` — Remove Backup **(action; not a review view)**
  - `#Files.Sync` — Sync
  - `#Files.Rsync_Daemon` — Rsync Daemon
- `#Interfaces` — Interfaces
  - `#Interfaces.Interface` — Interface
  - `#Interfaces.Detect_Internet_State` — Detect Internet State
  - `#Interfaces.Detect_Internet` — Detect Internet
  - `#Interfaces.Interface_Lists` — Interface Lists
  - `#Interfaces.Interface_List` — Interface List
  - `#Interfaces.Ethernet` — Ethernet
  - `#Interfaces.PWR` — PWR
  - `#Interfaces.Power_Cycle` — Power Cycle **(doit; not a review view)**
  - `#Interfaces.Cable_Test` — Cable Test **(action; not a review view)**
  - `#Interfaces.EoIP_Tunnel` — EoIP Tunnel
  - `#Interfaces.IP_Tunnel` — IP Tunnel
  - `#Interfaces.GRE_Tunnel` — GRE Tunnel
  - `#Interfaces.VLAN` — VLAN
  - `#Interfaces.VXLAN` — VXLAN
  - `#Interfaces.VTEP` — VTEP
  - `#Interfaces.FDB` — FDB
  - `#Interfaces.VRRP` — VRRP
  - `#Interfaces.VETH` — VETH
  - `#Interfaces.MACsec` — MACsec
  - `#Interfaces.Profiles` — Profiles
  - `#Interfaces.MACVLAN` — MACVLAN
  - `#Interfaces.Bonding` — Bonding
  - `#Interfaces.Monitor_Slaves` — Monitor Slaves
  - `#Interfaces.Loopback` — Loopback
  - `#Interfaces.VRF` — VRF
  - `#Interfaces.LTE` — LTE
  - `#Interfaces.LTE_Firmware_Upgrade` — LTE Firmware Upgrade **(action; not a review view)**
  - `#Interfaces.LTE_Cell_Monitor` — LTE Cell Monitor
  - `#Interfaces.LTE_APNs` — LTE APNs
  - `#Interfaces.LTE_Scanner` — LTE Scanner
  - `#Interfaces.LTE_Bands` — LTE Bands
  - `#Interfaces.NR_Bands` — NR Bands
  - `#Interfaces.LTE_Network_Modes` — LTE Network Modes
  - `#Interfaces.Modem` — Modem
  - `#Interfaces.Antenna_Scan` — Antenna Scan **(action; not a review view)**
  - `#Interfaces.PWR_Configure` — PWR Configure **(doit; not a review view)**
- `#LCD` — LCD
  - `#LCD.LCD` — LCD
  - `#LCD.Pin` — Pin
  - `#LCD.LCD_Screen_List` — LCD Screen List
  - `#LCD.LCD_Interface_List` — LCD Interface List
  - `#LCD.LCD_Page_List` — LCD Page List
- `#LTE_eSIM` — LTE eSIM
  - `#LTE_eSIM.LTE_eSIM` — LTE eSIM
  - `#LTE_eSIM.Set_Nickname` — Set Nickname **(doit; not a review view)**
  - `#LTE_eSIM.Refresh_Profile_List` — Refresh Profile List **(doit; not a review view)**
  - `#LTE_eSIM.Provision` — Provision **(action; not a review view)**
  - `#LTE_eSIM.eSIM_ID` — eSIM ID **(action; not a review view)**
- `#Log` — Log
  - `#Log.Log` — Log
- `#Make_Supout_rif` — Make Supout.rif
  - `#Make_Supout_rif.Make_it!` — Make it! **(action; not a review view)**
- `#Mesh` — Mesh
  - `#Mesh.Mesh` — Mesh
  - `#Mesh.Mesh_Traceroute` — Mesh Traceroute
  - `#Mesh.Ports` — Ports
  - `#Mesh.FDB` — FDB
- `#New_Terminal` — Terminal (service: New Terminal)
  - `#New_Terminal.Terminal` — Terminal **(alias; not a review view)**
- `#OpenFlow` — OpenFlow
  - `#OpenFlow.Switches` — Switches
  - `#OpenFlow.Flows` — Flows
  - `#OpenFlow.Ports` — Ports
  - `#OpenFlow.Groups` — Groups
  - `#OpenFlow.Meters` — Meters
- `#PPP` — PPP
  - `#PPP.Interface` — Interface
  - `#PPP.PPP_Server` — PPP Server
  - `#PPP.PPP_Client` — PPP Client
  - `#PPP.PPP_Scanner` — PPP Scanner
  - `#PPP.PPP_Info` — PPP Info **(action; not a review view)**
  - `#PPP.PPTP_Server` — PPTP Server
  - `#PPP.PPTP_Server_Binding` — PPTP Server Binding
  - `#PPP.PPTP_Client` — PPTP Client
  - `#PPP.SSTP_Server` — SSTP Server
  - `#PPP.SSTP_Server_Binding` — SSTP Server Binding
  - `#PPP.SSTP_Client` — SSTP Client
  - `#PPP.L2TP_Server` — L2TP Server
  - `#PPP.L2TP_Server_Binding` — L2TP Server Binding
  - `#PPP.L2TP_Client` — L2TP Client
  - `#PPP.Export__ovpn` — Export .ovpn **(action; not a review view)**
  - `#PPP.OVPN_Server_Binding` — OVPN Server Binding
  - `#PPP.OVPN_Client` — OVPN Client
  - `#PPP.Import__ovpn` — Import .ovpn **(action; not a review view)**
  - `#PPP.PPPoE_Server_Binding` — PPPoE Server Binding
  - `#PPP.PPPoE_Client` — PPPoE Client
  - `#PPP.PPPoE_Scan` — PPPoE Scan
  - `#PPP.PPPoE_Servers` — PPPoE Servers
  - `#PPP.OVPN_Servers` — OVPN Servers
  - `#PPP.Secrets` — Secrets
  - `#PPP.PPP_Authentication&Accounting` — PPP Authentication&Accounting
  - `#PPP.Profiles` — Profiles
  - `#PPP.Active_Connections` — Active Connections
  - `#PPP.L2TP_Ethernet` — L2TP Ethernet
  - `#PPP.L2TP_Secrets` — L2TP Secrets
- `#Partition` — Partition
  - `#Partition.Partitions` — Partitions
  - `#Partition.Repartition` — Repartition **(doit; not a review view)**
  - `#Partition.Copy_To` — Copy To **(action; not a review view)**
  - `#Partition.Save_Config_To` — Save Config To **(action; not a review view)**
  - `#Partition.Restore_Config_From` — Restore Config From **(action; not a review view)**
- `#Port_Mapping` — Port Mapping
  - `#Port_Mapping.Port_Mapping` — Port Mapping
- `#Queues` — Queues
  - `#Queues.Simple_Queues` — Simple Queues
  - `#Queues.Interface_Queues` — Interface Queues
  - `#Queues.Queue_Tree` — Queue Tree
  - `#Queues.Queue_Types` — Queue Types
- `#Quick_Set` — Quick Set
  - `#Quick_Set.CPE` — CPE
  - `#Quick_Set.PTP_Bridge_AP` — PTP Bridge AP
  - `#Quick_Set.PTP_Bridge_CPE` — PTP Bridge CPE
  - `#Quick_Set.WISP_AP` — WISP AP
  - `#Quick_Set.Home_AP` — Home AP
  - `#Quick_Set.Home_AP` — Home AP
  - `#Quick_Set.Home_AP_Dual` — Home AP Dual
  - `#Quick_Set.Home_AP_Dual` — Home AP Dual
  - `#Quick_Set.Home_Mesh` — Home Mesh
  - `#Quick_Set.LTE` — LTE
  - `#Quick_Set.LTE_AP` — LTE AP
  - `#Quick_Set.LTE_AP` — LTE AP
  - `#Quick_Set.LTE_AP_Dual` — LTE AP Dual
  - `#Quick_Set.LTE_AP_Dual` — LTE AP Dual
  - `#Quick_Set.LTE_Mesh` — LTE Mesh
  - `#Quick_Set.W60G` — W60G
  - `#Quick_Set.Ethernet` — Ethernet
  - `#Quick_Set.CAP` — CAP
  - `#Quick_Set.CPE_Connect` — CPE Connect **(doit; not a review view)**
  - `#Quick_Set.PTP_Connect` — PTP Connect **(doit; not a review view)**
  - `#Quick_Set.Copy_To_ACL` — Copy To ACL **(doit; not a review view)**
  - `#Quick_Set.Remove_From_ACL` — Remove From ACL **(doit; not a review view)**
  - `#Quick_Set.Upgrade` — Upgrade **(doit; not a review view)**
  - `#Quick_Set.Countries` — Countries
  - `#Quick_Set.Countries` — Countries
- `#RADIUS` — RADIUS
  - `#RADIUS.RADIUS` — RADIUS
  - `#RADIUS.Incoming` — Incoming
- `#WiFi` — WiFi
  - `#WiFi.WiFi` — WiFi
  - `#WiFi.CAP` — CAP
  - `#WiFi.CAPsMAN` — CAPsMAN
  - `#WiFi.WPS_Client` — WPS Client **(action; not a review view)**
  - `#WiFi.Scan` — Scan
  - `#WiFi.Freq__Usage` — Freq. Usage
  - `#WiFi.Sniffer` — Sniffer
  - `#WiFi.Flat_Snoop` — Flat Snoop
  - `#WiFi.Network` — Network
  - `#WiFi.Network_Radios` — Network Radios
  - `#WiFi.Configuration` — Configuration
  - `#WiFi.Channel` — Channel
  - `#WiFi.Security` — Security
  - `#WiFi.Multi_Passphrase_Group` — Multi Passphrase Group
  - `#WiFi.AAA` — AAA
  - `#WiFi.Datapath` — Datapath
  - `#WiFi.Interworking` — Interworking
  - `#WiFi.Steering` — Steering
  - `#WiFi.Neighbor_Group` — Neighbor Group
  - `#WiFi.Registration` — Registration
  - `#WiFi.Access_List` — Access List
  - `#WiFi.Provisioning` — Provisioning
  - `#WiFi.Radios` — Radios
  - `#WiFi.Radios_Settings` — Radios Settings
  - `#WiFi.Remote_CAP` — Remote CAP
  - `#WiFi.Set_Identity` — Set Identity **(doit; not a review view)**
  - `#WiFi.Connect` — Connect **(doit; not a review view)**
  - `#WiFi.Countries` — Countries
  - `#WiFi.All_Countries` — All Countries
- `#WireGuard` — WireGuard
  - `#WireGuard.WireGuard` — WireGuard
  - `#WireGuard.WG_Export` — WG Export **(doit; not a review view)**
  - `#WireGuard.WG_Import` — WG Import **(doit; not a review view)**
  - `#WireGuard.Peers` — Peers

## IP

- `#IP:ARP` — ARP
  - `#IP:ARP.ARP_List` — ARP List
- `#IP:Addresses` — Addresses
  - `#IP:Addresses.Address` — Address
- `#IP:Cloud` — Cloud
  - `#IP:Cloud.Cloud` — Cloud
  - `#IP:Cloud.Back_To_Home_Users` — Back To Home Users
  - `#IP:Cloud.Back_To_Home_Files` — Back To Home Files
- `#IP:DHCP_Client` — DHCP Client
  - `#IP:DHCP_Client.DHCP_Client` — DHCP Client
  - `#IP:DHCP_Client.DHCP_Client_Options` — DHCP Client Options
- `#IP:DHCP_Relay` — DHCP Relay
  - `#IP:DHCP_Relay.DHCP_Relay` — DHCP Relay
- `#IP:DHCP_Server` — DHCP Server
  - `#IP:DHCP_Server.DHCP` — DHCP
  - `#IP:DHCP_Server.DHCP_Config` — DHCP Config
  - `#IP:DHCP_Server.DHCP_Setup` — DHCP Setup
  - `#IP:DHCP_Server.Networks` — Networks
  - `#IP:DHCP_Server.Leases` — Leases
  - `#IP:DHCP_Server.Options` — Options
  - `#IP:DHCP_Server.Option_Sets` — Option Sets
  - `#IP:DHCP_Server.Option_Matcher` — Option Matcher
  - `#IP:DHCP_Server.Alerts` — Alerts
- `#IP:DNS` — DNS
  - `#IP:DNS.Settings` — Settings
  - `#IP:DNS.Static` — Static
  - `#IP:DNS.Cache` — Cache
  - `#IP:DNS.Adlist` — Adlist
  - `#IP:DNS.Forwarders` — Forwarders
- `#IP:Firewall` — Firewall
  - `#IP:Firewall.Filter_Rules` — Filter Rules
  - `#IP:Firewall.NAT` — NAT
  - `#IP:Firewall.Mangle` — Mangle
  - `#IP:Firewall.Raw` — Raw
  - `#IP:Firewall.Service_Ports` — Service Ports
  - `#IP:Firewall.Connections` — Connections
  - `#IP:Firewall.Tracking` — Tracking
  - `#IP:Firewall.Address_Lists` — Address Lists
  - `#IP:Firewall.Layer7_Protocols` — Layer7 Protocols
- `#IP:Hotspot` — Hotspot
  - `#IP:Hotspot.Servers` — Servers
  - `#IP:Hotspot.Hotspot_Setup` — Hotspot Setup
  - `#IP:Hotspot.Server_Profiles` — Server Profiles
  - `#IP:Hotspot.Users` — Users
  - `#IP:Hotspot.User_Profiles` — User Profiles
  - `#IP:Hotspot.Active` — Active
  - `#IP:Hotspot.Hosts` — Hosts
  - `#IP:Hotspot.IP_Bindings` — IP Bindings
  - `#IP:Hotspot.Service_Ports` — Service Ports
  - `#IP:Hotspot.Walled_Garden` — Walled Garden
  - `#IP:Hotspot.Walled_Garden_IP_List` — Walled Garden IP List
  - `#IP:Hotspot.Cookies` — Cookies
- `#IP:IPsec` — IPsec
  - `#IP:IPsec.Policies` — Policies
  - `#IP:IPsec.Statistics` — Statistics
  - `#IP:IPsec.Proposals` — Proposals
  - `#IP:IPsec.Groups` — Groups
  - `#IP:IPsec.Peers` — Peers
  - `#IP:IPsec.Identities` — Identities
  - `#IP:IPsec.Settings` — Settings
  - `#IP:IPsec.Profiles` — Profiles
  - `#IP:IPsec.Active_Peers` — Active Peers
  - `#IP:IPsec.Mode_Configs` — Mode Configs
  - `#IP:IPsec.Installed_SAs` — Installed SAs
  - `#IP:IPsec.Keys` — Keys
- `#IP:Kid_Control` — Kid Control
  - `#IP:Kid_Control.Kids` — Kids
  - `#IP:Kid_Control.Devices` — Devices
- `#IP:Media` — Media
  - `#IP:Media.Media` — Media
  - `#IP:Media.Settings` — Settings
- `#IP:NAT_PMP` — NAT PMP
  - `#IP:NAT_PMP.NAT_PMP_Settings` — NAT PMP Settings
  - `#IP:NAT_PMP.Interfaces` — Interfaces
- `#IP:Neighbors` — Neighbors
  - `#IP:Neighbors.Neighbors` — Neighbors
  - `#IP:Neighbors.Discovery_Settings` — Discovery Settings
- `#IP:Packing` — Packing
  - `#IP:Packing.IP_Packing` — IP Packing
- `#IP:Pool` — Pool
  - `#IP:Pool.Pools` — Pools
  - `#IP:Pool.Used_Addresses` — Used Addresses
- `#IP:Reverse_Proxy` — Reverse Proxy
  - `#IP:Reverse_Proxy.Rules` — Rules
- `#IP:Routes` — Routes
  - `#IP:Routes.All_Routes` — All Routes
  - `#IP:Routes.Routes` — Routes
- `#IP:SMB` — SMB
  - `#IP:SMB.Settings` — Settings
  - `#IP:SMB.Shares` — Shares
  - `#IP:SMB.Users` — Users
- `#IP:SNMP` — SNMP
  - `#IP:SNMP.SNMP_Settings` — SNMP Settings
  - `#IP:SNMP.Communities` — Communities
  - `#IP:SNMP.Trap_Generators` — Trap Generators
- `#IP:SSH` — SSH
  - `#IP:SSH.SSH` — SSH
- `#IP:Services` — Services
  - `#IP:Services.Services` — Services
  - `#IP:Services.Web_Server` — Web Server
- `#IP:Settings` — Settings
  - `#IP:Settings.IP_Settings` — IP Settings
- `#IP:Socks` — Socks
  - `#IP:Socks.Settings` — Settings
  - `#IP:Socks.Access` — Access
  - `#IP:Socks.Connections` — Connections
  - `#IP:Socks.Users` — Users
- `#IP:Socksify` — Socksify
  - `#IP:Socksify.Socksify` — Socksify
- `#IP:TFTP` — TFTP
  - `#IP:TFTP.TFTP_Rules` — TFTP Rules
  - `#IP:TFTP.Settings` — Settings
- `#IP:Traffic_Flow` — Traffic Flow
  - `#IP:Traffic_Flow.Traffic_Flow_Settings` — Traffic Flow Settings
  - `#IP:Traffic_Flow.Targets` — Targets
- `#IP:UPnP` — UPnP
  - `#IP:UPnP.UPnP_Settings` — UPnP Settings
  - `#IP:UPnP.Interfaces` — Interfaces
- `#IP:VRF` — VRF
  - `#IP:VRF.VRF` — VRF
- `#IP:Web_Proxy` — Web Proxy
  - `#IP:Web_Proxy.Web_Proxy_Settings` — Web Proxy Settings
  - `#IP:Web_Proxy.Access` — Access
  - `#IP:Web_Proxy.Cache` — Cache
  - `#IP:Web_Proxy.Direct` — Direct
  - `#IP:Web_Proxy.Connections` — Connections
  - `#IP:Web_Proxy.Cache_Contents` — Cache Contents

## IPv6

- `#IPv6:Addresses` — Addresses
  - `#IPv6:Addresses.Address` — Address
- `#IPv6:DHCPv6_Client` — DHCPv6 Client
  - `#IPv6:DHCPv6_Client.DHCP_Client` — DHCP Client
  - `#IPv6:DHCPv6_Client.Client_Options` — Client Options
- `#IPv6:DHCPv6_Relay` — DHCPv6 Relay
  - `#IPv6:DHCPv6_Relay.DHCP_Relay` — DHCP Relay
  - `#IPv6:DHCPv6_Relay.Relayed_Bindings` — Relayed Bindings
  - `#IPv6:DHCPv6_Relay.Options` — Options
- `#IPv6:DHCPv6_Server` — DHCPv6 Server
  - `#IPv6:DHCPv6_Server.DHCP` — DHCP
  - `#IPv6:DHCPv6_Server.Bindings` — Bindings
  - `#IPv6:DHCPv6_Server.Options` — Options
  - `#IPv6:DHCPv6_Server.Option_Sets` — Option Sets
- `#IPv6:Firewall` — IPv6 Firewall (service: Firewall)
  - `#IPv6:Firewall.Filter_Rules` — Filter Rules
  - `#IPv6:Firewall.NAT` — NAT
  - `#IPv6:Firewall.Mangle` — Mangle
  - `#IPv6:Firewall.Raw` — Raw
  - `#IPv6:Firewall.Connections` — Connections
  - `#IPv6:Firewall.Address_Lists` — Address Lists
- `#IPv6:ND` — Neighbor Discovery (service: ND)
  - `#IPv6:ND.Interfaces` — Interfaces
  - `#IPv6:ND.Settings` — Settings
  - `#IPv6:ND.Prefixes` — Prefixes
  - `#IPv6:ND.Default` — Default
  - `#IPv6:ND.Proxy` — Proxy
- `#IPv6:Neighbors` — Neighbors
  - `#IPv6:Neighbors.Neighbor_List` — Neighbor List
- `#IPv6:Pool` — IPv6 Pool (service: Pool)
  - `#IPv6:Pool.Pools` — Pools
  - `#IPv6:Pool.Used_Prefixes` — Used Prefixes
- `#IPv6:Routes` — Routes
  - `#IPv6:Routes.Routes6` — Routes6
- `#IPv6:Settings` — Settings
  - `#IPv6:Settings.IPv6_Settings` — IPv6 Settings

## System

- `#System:CMR_Client` — CMR Client
  - `#System:CMR_Client.CMR_Client` — CMR Client
  - `#System:CMR_Client.Push_Button` — Push Button **(action; not a review view)**
- `#System:Certificates` — Certificates
  - `#System:Certificates.Certificates` — Certificates
  - `#System:Certificates.Create_Cert__Request` — Create Cert. Request **(action; not a review view)**
  - `#System:Certificates.Sign` — Sign **(action; not a review view)**
  - `#System:Certificates.Sign_via_SCEP` — Sign via SCEP **(doit; not a review view)**
  - `#System:Certificates.Add_ACME_Certificate` — Add ACME Certificate **(doit; not a review view)**
  - `#System:Certificates.Export` — Export **(doit; not a review view)**
  - `#System:Certificates.Settings` — Settings
  - `#System:Certificates.SCEP_Servers` — SCEP Servers
  - `#System:Certificates.SCEP_RA` — SCEP RA
  - `#System:Certificates.Requests` — Requests
  - `#System:Certificates.OTP` — OTP
  - `#System:Certificates.CRL` — CRL
  - `#System:Certificates.Built_In_CA` — Built In CA
- `#System:Clock` — Clock
  - `#System:Clock.Clock` — Clock
- `#System:Console` — Console
  - `#System:Console.Console` — Console
  - `#System:Console.Screen` — Screen
  - `#System:Console.Console` — Console
- `#System:Disks` — Disks
  - `#System:Disks.Disks` — Disks
  - `#System:Disks.Settings` — Settings
  - `#System:Disks.Format_Drive` — Format Drive
  - `#System:Disks.Check_File_System` — Check File System
  - `#System:Disks.Repair_File_System` — Repair File System
  - `#System:Disks.Smart_Info` — Smart Info
  - `#System:Disks.Copy` — Copy
  - `#System:Disks.NVMe_Discover` — NVMe Discover
  - `#System:Disks.Test_Disks` — Test Disks
- `#System:Figman` — Figman
  - `#System:Figman.Connect` — Connect
  - `#System:Figman.Generate_ID` — Generate ID
  - `#System:Figman.Peer` — Peer
  - `#System:Figman.Stats` — Stats **(action; not a review view)**
  - `#System:Figman.Store` — Store
  - `#System:Figman.Local` — Local
  - `#System:Figman.Remote` — Remote
  - `#System:Figman.Accept` — Accept
- `#System:Health` — Health
  - `#System:Health.System_Health` — System Health
  - `#System:Health.Settings` — Settings
  - `#System:Health.System_Health` — System Health
- `#System:History` — History
  - `#System:History.History` — History
- `#System:Identity` — Identity
  - `#System:Identity.Identity` — Identity
- `#System:Keymat_Provider` — Keymat Provider
  - `#System:Keymat_Provider.Keymat_Provider` — Keymat Provider
  - `#System:Keymat_Provider.Get_Status` — Get Status **(action; not a review view)**
  - `#System:Keymat_Provider.Get_Key` — Get Key **(doit; not a review view)**
  - `#System:Keymat_Provider.Get_Key_With_IDs` — Get Key With IDs **(doit; not a review view)**
- `#System:LEDs` — LEDs
  - `#System:LEDs.Triggers` — Triggers
  - `#System:LEDs.Settings` — Settings
  - `#System:LEDs.LEDs` — LEDs
- `#System:License` — License
  - `#System:License.License` — License
  - `#System:License.License` — License
  - `#System:License.Renew_License` — Renew License **(action; not a review view)**
- `#System:Logging` — Logging
  - `#System:Logging.Rules` — Rules
  - `#System:Logging.Actions` — Actions
- `#System:NTP_Client` — NTP Client
  - `#System:NTP_Client.NTP_Client` — NTP Client
  - `#System:NTP_Client.Servers` — Servers
  - `#System:NTP_Client.Peers` — Peers
- `#System:NTP_Server` — NTP Server
  - `#System:NTP_Server.NTP_Server` — NTP Server
  - `#System:NTP_Server.Keys` — Keys
- `#System:Note` — Note
  - `#System:Note.System_Note` — System Note
- `#System:PTP` — PTP
  - `#System:PTP.PTP` — PTP
  - `#System:PTP.Port` — Port
  - `#System:PTP.Status` — Status
- `#System:Packages` — Packages
  - `#System:Packages.Packages` — Packages
  - `#System:Packages.Check_Installation` — Check Installation **(action; not a review view)**
  - `#System:Packages.Check_For_Updates` — Check For Updates
  - `#System:Packages.Local_Update_Packages` — Local Update Packages
  - `#System:Packages.Local_Package_Sources` — Local Package Sources
  - `#System:Packages.Mirror` — Mirror
- `#System:Password` — Password
  - `#System:Password.Change` — Change **(doit; not a review view)**
  - `#System:Password.Change_Now` — Change Now **(doit; not a review view)**
- `#System:Ports` — Ports
  - `#System:Ports.Ports` — Ports
  - `#System:Ports.Remote_Access` — Remote Access
- `#System:Reboot` — Reboot
  - `#System:Reboot.Reboot` — Reboot **(doit; not a review view)**
- `#System:Regulatory` — Regulatory
  - `#System:Regulatory.Regulatory` — Regulatory
- `#System:Reset_Configuration` — Reset Configuration
  - `#System:Reset_Configuration.Reset_Configuration` — Reset Configuration **(doit; not a review view)**
  - `#System:Reset_Configuration.Default_Configuration` — Default Configuration
- `#System:Resources` — Resources
  - `#System:Resources.Resources` — Resources
  - `#System:Resources.Hardware` — Hardware
  - `#System:Resources.CPU` — CPU
  - `#System:Resources.IRQ` — IRQ
  - `#System:Resources.RPS` — RPS
- `#System:RouterBOARD` — RouterBOARD
  - `#System:RouterBOARD.RouterBOARD` — RouterBOARD
  - `#System:RouterBOARD.Settings` — Settings
  - `#System:RouterBOARD.PoE_Settings` — PoE Settings
  - `#System:RouterBOARD.USB` — USB
  - `#System:RouterBOARD.USB_Power_Reset` — USB Power Reset **(doit; not a review view)**
  - `#System:RouterBOARD.Mode_Button` — Mode Button
  - `#System:RouterBOARD.Reset_Button` — Reset Button
  - `#System:RouterBOARD.CPU_Frequency` — CPU Frequency
  - `#System:RouterBOARD.Mem_Data_Rate` — Mem Data Rate
  - `#System:RouterBOARD.Boot_Devices` — Boot Devices
  - `#System:RouterBOARD.SIM_Slots` — SIM Slots
  - `#System:RouterBOARD.SIM_Links` — SIM Links
- `#System:Scheduler` — Scheduler
  - `#System:Scheduler.Scheduler` — Scheduler
- `#System:Scripts` — Scripts
  - `#System:Scripts.Scripts` — Scripts
  - `#System:Scripts.Jobs` — Jobs
  - `#System:Scripts.Environment` — Environment
- `#System:Shutdown` — Shutdown
  - `#System:Shutdown.Shutdown` — Shutdown **(doit; not a review view)**
- `#System:Special_Login` — Special Login
  - `#System:Special_Login.Special_Login` — Special Login
- `#System:SwOS` — SwOS
  - `#System:SwOS.SwOS` — SwOS
  - `#System:SwOS.Upgrade` — Upgrade **(action; not a review view)**
- `#System:UPS` — UPS (x86 CHR serves `ups.jg` in base; ARM64 7.24.5 serves
  none even with the `ups` package installed, though `/system/ups` then works)
  - `#System:UPS.UPS` — UPS
- `#System:Users` — Users
  - `#System:Users.Users` — Users
  - `#System:Users.Change_Password` — Change Password
  - `#System:Users.Settings` — Settings
  - `#System:Users.AAA` — AAA
  - `#System:Users.Groups` — Groups
  - `#System:Users.Skins` — Skins
  - `#System:Users.SSH_Keys` — SSH Keys
  - `#System:Users.SSH_Private_Keys` — SSH Private Keys
  - `#System:Users.Active_Users` — Active Users
- `#System:Watchdog` — Watchdog
  - `#System:Watchdog.Watchdog` — Watchdog

## Routing

- `#Routing:BFD` — BFD
  - `#Routing:BFD.Configuration` — Configuration
  - `#Routing:BFD.Session` — Session
- `#Routing:BGP` — BGP
  - `#Routing:BGP.Instances` — Instances
  - `#Routing:BGP.Templates` — Templates
  - `#Routing:BGP.Connections` — Connections
  - `#Routing:BGP.Sessions` — Sessions
  - `#Routing:BGP.Resend` — Resend **(doit; not a review view)**
  - `#Routing:BGP.Refresh` — Refresh **(doit; not a review view)**
  - `#Routing:BGP.Clear` — Clear **(doit; not a review view)**
  - `#Routing:BGP.Dump_Adv_` — Dump Adv. **(doit; not a review view)**
  - `#Routing:BGP.VPN` — VPN
- `#Routing:Filters` — Filters
  - `#Routing:Filters.Rule` — Rule
  - `#Routing:Filters.Filter_Wizard` — Filter Wizard **(doit; not a review view)**
  - `#Routing:Filters.Select_Rule` — Select Rule
  - `#Routing:Filters.Num_Set` — Num Set
  - `#Routing:Filters.Community_Set` — Community Set
  - `#Routing:Filters.Community_Ext_Set` — Community Ext Set
  - `#Routing:Filters.Community_Large_Set` — Community Large Set
  - `#Routing:Filters.Chain` — Chain
  - `#Routing:Filters.Select_Chain` — Select Chain
- `#Routing:GMP` — GMP
  - `#Routing:GMP.GMP` — GMP
- `#Routing:IGMP_Proxy` — IGMP Proxy
  - `#Routing:IGMP_Proxy.Interface` — Interface
  - `#Routing:IGMP_Proxy.Settings` — Settings
  - `#Routing:IGMP_Proxy.MFC` — MFC
- `#Routing:Nexthops` — Nexthops
  - `#Routing:Nexthops.Nexthops` — Nexthops
- `#Routing:OSPF` — OSPF
  - `#Routing:OSPF.Instances` — Instances
  - `#Routing:OSPF.Areas` — Areas
  - `#Routing:OSPF.Area_Ranges` — Area Ranges
  - `#Routing:OSPF.Interface_Templates` — Interface Templates
  - `#Routing:OSPF.Interfaces` — Interfaces
  - `#Routing:OSPF.Static_Neighbors` — Static Neighbors
  - `#Routing:OSPF.Neighbors` — Neighbors
  - `#Routing:OSPF.LSA` — LSA
- `#Routing:PIM_SM` — PIM SM
  - `#Routing:PIM_SM.Instance` — Instance
  - `#Routing:PIM_SM.Interface_Template` — Interface Template
  - `#Routing:PIM_SM.Interface` — Interface
  - `#Routing:PIM_SM.Neighbor` — Neighbor
  - `#Routing:PIM_SM.Static_RP` — Static RP
  - `#Routing:PIM_SM.UIB_G` — UIB G
  - `#Routing:PIM_SM.UIB_SG` — UIB SG
  - `#Routing:PIM_SM.BSR` — BSR
  - `#Routing:PIM_SM.RP_Set` — RP Set
  - `#Routing:PIM_SM.Candidate` — Candidate
  - `#Routing:PIM_SM.RP_Candidate` — RP Candidate
- `#Routing:RIP` — RIP
  - `#Routing:RIP.Instance` — Instance
  - `#Routing:RIP.Interface_Templates` — Interface Templates
  - `#Routing:RIP.Interface` — Interface
  - `#Routing:RIP.Neighbors` — Neighbors
  - `#Routing:RIP.Static_Neighbors` — Static Neighbors
  - `#Routing:RIP.Keys` — Keys
- `#Routing:RPKI` — RPKI
  - `#Routing:RPKI.RPKI` — RPKI
  - `#Routing:RPKI.Sessions` — Sessions
- `#Routing:Router_ID` — Router ID
  - `#Routing:Router_ID.Router_IDs` — Router IDs
- `#Routing:Rules` — Rules
  - `#Routing:Rules.Rules` — Rules
- `#Routing:Settings` — Settings
  - `#Routing:Settings.Routing_Settings` — Routing Settings
  - `#Routing:Settings.Chains` — Chains
- `#Routing:Tables` — Tables
  - `#Routing:Tables.Tables` — Tables

## MPLS

- `#MPLS:MPLS` — MPLS
  - `#MPLS:MPLS.LDP_Instance` — LDP Instance
  - `#MPLS:MPLS.LDP_Interface` — LDP Interface
  - `#MPLS:MPLS.LDP_Neighbor` — LDP Neighbor
  - `#MPLS:MPLS.Accept_Filter` — Accept Filter
  - `#MPLS:MPLS.Advertise_Filter` — Advertise Filter
  - `#MPLS:MPLS.Local_Mapping` — Local Mapping
  - `#MPLS:MPLS.Remote_Mapping` — Remote Mapping
  - `#MPLS:MPLS.MPLS_Interface` — MPLS Interface
  - `#MPLS:MPLS.MPLS_Mangle` — MPLS Mangle
  - `#MPLS:MPLS.Forwarding_Table` — Forwarding Table
- `#MPLS:Settings` — Settings
  - `#MPLS:Settings.MPLS_Settings` — MPLS Settings
- `#MPLS:Traffic_Eng` — Traffic Eng
  - `#MPLS:Traffic_Eng.Interface` — Interface
  - `#MPLS:Traffic_Eng.Tunnel_Path` — Tunnel Path
  - `#MPLS:Traffic_Eng.Tunnel` — Tunnel
  - `#MPLS:Traffic_Eng.Flow` — Flow
- `#MPLS:VPLS` — VPLS
  - `#MPLS:VPLS.VPLS` — VPLS
  - `#MPLS:VPLS.BGP_VPLS` — BGP VPLS

## Switch

- `#Switch:ACL` — ACL
  - `#Switch:ACL.ACL` — ACL
  - `#Switch:ACL.Policer` — Policer
- `#Switch:FDBs` — FDBs
  - `#Switch:FDBs.Unicast_FDB` — Unicast FDB
  - `#Switch:FDBs.Multicast_FDB` — Multicast FDB
  - `#Switch:FDBs.Reserved_FDB` — Reserved FDB
- `#Switch:Host` — Host
  - `#Switch:Host.Host` — Host
- `#Switch:L3HW` — L3HW
  - `#Switch:L3HW.L3_Hw_Settings` — L3 Hw Settings
- `#Switch:Port_Isolation` — Port Isolation
  - `#Switch:Port_Isolation.Port_Isolation` — Port Isolation
- `#Switch:Ports` — Ports
  - `#Switch:Ports.Port` — Port
- `#Switch:Ports` — Ports
  - `#Switch:Ports.Ports` — Ports
  - `#Switch:Ports.Trunk` — Trunk
  - `#Switch:Ports.Port_Isolation` — Port Isolation
  - `#Switch:Ports.Port_Leakage` — Port Leakage
- `#Switch:QoS` — QoS
  - `#Switch:QoS.Port` — Port
  - `#Switch:QoS.Settings` — Settings
  - `#Switch:QoS.QoS_Monitor` — QoS Monitor
  - `#Switch:QoS.Profile` — Profile
  - `#Switch:QoS.VLAN_PCP_Mapping` — VLAN PCP Mapping
  - `#Switch:QoS.IP_DSCP_Mapping` — IP DSCP Mapping
  - `#Switch:QoS.Maps` — Maps
  - `#Switch:QoS.Priority_Flow_Control` — Priority Flow Control
  - `#Switch:QoS.Tx_Queue` — Tx Queue
  - `#Switch:QoS.Tx_Manager` — Tx Manager
- `#Switch:QoS` — QoS
  - `#Switch:QoS.Shaper` — Shaper
  - `#Switch:QoS.Ingress_Port_Policer` — Ingress Port Policer
  - `#Switch:QoS.QoS_Groups` — QoS Groups
  - `#Switch:QoS.QoS_DSCP_Map` — QoS DSCP Map
  - `#Switch:QoS.Policer_QoS_Map` — Policer QoS Map
- `#Switch:Rule` — Rule
  - `#Switch:Rule.Rule` — Rule
- `#Switch:Settings` — Switch (service: Settings)
  - `#Switch:Settings.Switch` — Switch
- `#Switch:Settings` — Settings
  - `#Switch:Settings.Switch_Settings` — Switch Settings
- `#Switch:VLAN` — VLAN
  - `#Switch:VLAN.VLAN` — VLAN
- `#Switch:VLAN` — VLAN
  - `#Switch:VLAN.VLAN` — VLAN
  - `#Switch:VLAN.Eg__VLAN_Tag` — Eg. VLAN Tag
  - `#Switch:VLAN.In__VLAN_Tran_` — In. VLAN Tran.
  - `#Switch:VLAN.Eg__VLAN_Tran_` — Eg. VLAN Tran.
  - `#Switch:VLAN.1:1_VLAN_Switching` — 1:1 VLAN Switching
  - `#Switch:VLAN.MAC_Based_VLAN` — MAC Based VLAN
  - `#Switch:VLAN.Protocol_Based_VLAN` — Protocol Based VLAN

## Tools

- `#Tools:Apptraffic` — Apptraffic
  - `#Tools:Apptraffic.Applications` — Applications
  - `#Tools:Apptraffic.Categories` — Categories
  - `#Tools:Apptraffic.Configuration` — Configuration
- `#Tools:BTest_Server` — BTest Server
  - `#Tools:BTest_Server.BTest_Server_Settings` — BTest Server Settings
  - `#Tools:BTest_Server.Sessions` — Sessions
- `#Tools:Bandwidth_Test` — Bandwidth Test
  - `#Tools:Bandwidth_Test.Bandwidth_Test` — Bandwidth Test **(action; not a review view)**
- `#Tools:Email` — Email
  - `#Tools:Email.Email_Settings` — Email Settings
  - `#Tools:Email.Send_Email` — Send Email **(doit; not a review view)**
- `#Tools:Flood_Ping` — Flood Ping
  - `#Tools:Flood_Ping.Flood_Ping` — Flood Ping **(action; not a review view)**
- `#Tools:Graphing` — Graphing
  - `#Tools:Graphing.Interface_Rules` — Interface Rules
  - `#Tools:Graphing.Graphing_Settings` — Graphing Settings
  - `#Tools:Graphing.Queue_Rules` — Queue Rules
  - `#Tools:Graphing.Resource_Rules` — Resource Rules
  - `#Tools:Graphing.Interface_Graphs` — Interface Graphs
  - `#Tools:Graphing.Queue_Graphs` — Queue Graphs
  - `#Tools:Graphing.Resource_Graphs` — Resource Graphs
- `#Tools:IP_Scan` — IP Scan
  - `#Tools:IP_Scan.IP_Scan` — IP Scan
- `#Tools:MAC_Server` — MAC Server
  - `#Tools:MAC_Server.Active_Sessions` — Active Sessions
  - `#Tools:MAC_Server.MAC_Telnet_Server` — MAC Telnet Server
  - `#Tools:MAC_Server.MAC_WinBox_Server` — MAC WinBox Server
  - `#Tools:MAC_Server.MAC_Ping_Server` — MAC Ping Server
- `#Tools:Netwatch` — Netwatch
  - `#Tools:Netwatch.Netwatch` — Netwatch
- `#Tools:Packet_Sniffer` — Packet Sniffer
  - `#Tools:Packet_Sniffer.Packet_Sniffer_Settings` — Packet Sniffer Settings
  - `#Tools:Packet_Sniffer.Packets` — Packets
  - `#Tools:Packet_Sniffer.Connections` — Connections
  - `#Tools:Packet_Sniffer.Hosts` — Hosts
  - `#Tools:Packet_Sniffer.Protocols` — Protocols
  - `#Tools:Packet_Sniffer.Quick` — Quick
- `#Tools:Ping` — Ping
  - `#Tools:Ping.Ping` — Ping
- `#Tools:Ping_Speed` — Ping Speed
  - `#Tools:Ping_Speed.Ping_Speed` — Ping Speed **(action; not a review view)**
- `#Tools:Profile` — Profile
  - `#Tools:Profile.Profile` — Profile
- `#Tools:RoMON` — RoMON
  - `#Tools:RoMON.RoMON` — RoMON
  - `#Tools:RoMON.Ports` — Ports
  - `#Tools:RoMON.Discovery` — Discovery
  - `#Tools:RoMON.Ping` — Ping
- `#Tools:SMS` — SMS
  - `#Tools:SMS.SMS` — SMS
  - `#Tools:SMS.Inbox` — Inbox
  - `#Tools:SMS.Send_SMS` — Send SMS **(doit; not a review view)**
- `#Tools:Speed_Test` — Speed Test
  - `#Tools:Speed_Test.Speed_Test` — Speed Test **(action; not a review view)**
- `#Tools:Telnet` — Telnet
  - `#Tools:Telnet.Telnet` — Telnet **(termopen; not a review view)**
- `#Tools:Torch` — Torch
  - `#Tools:Torch.Torch` — Torch
- `#Tools:Traceroute` — Traceroute
  - `#Tools:Traceroute.Traceroute` — Traceroute
- `#Tools:Traffic_Generator` — Traffic Generator
  - `#Tools:Traffic_Generator.Traffic_Generator` — Traffic Generator
  - `#Tools:Traffic_Generator.Inject_Pcap` — Inject Pcap **(action; not a review view)**
  - `#Tools:Traffic_Generator.Quick_Start` — Quick Start
  - `#Tools:Traffic_Generator.Ports` — Ports
  - `#Tools:Traffic_Generator.Packet_Templates` — Packet Templates
  - `#Tools:Traffic_Generator.Raw_Packet_Templates` — Raw Packet Templates
  - `#Tools:Traffic_Generator.Streams` — Streams
- `#Tools:Traffic_Generator_Stats` — Traffic Generator Stats
  - `#Tools:Traffic_Generator_Stats.Streams` — Streams
  - `#Tools:Traffic_Generator_Stats.Latency_Distribution` — Latency Distribution
  - `#Tools:Traffic_Generator_Stats.Ports` — Ports
  - `#Tools:Traffic_Generator_Stats.Raw` — Raw
- `#Tools:Traffic_Monitor` — Traffic Monitor
  - `#Tools:Traffic_Monitor.Traffic_Monitor` — Traffic Monitor
- `#Tools:WoL` — WoL
  - `#Tools:WoL.Wake_on_LAN` — Wake on LAN **(doit; not a review view)**

Special fragments: `#Quick_Set`, `#WebFig` (menu home), `#Terminal`, `#SkinDesigner`, `#About`.
