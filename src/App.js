import './App.css';
import { useState } from 'react';
const patches = require('./patches.json');
const {
    saveAs,
    MarcFile,
    parseBPSFile,
    parseIPSFile,
    md5,
} = require('./bps.js');

const sortFilter = (p1, p2) => p1.name > p2.name;

const sortedPatches = patches.sort(sortFilter);

const INES1HEADER = [78, 69, 83, 26, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const VANILLA_INES1_MD5 = 'ec58574d96bee8c8927884ae6e7a2508';

function Information({ hide, information }) {
    if (hide) return;
    return <p className="info">{information}</p>;
}

function SaveFile({ rom, patch }) {
    if (!rom) return;
    function downloadRom() {
        patchSomething(patch, rom);
    }
    return (
        <div className="download">
            <button onClick={downloadRom}>Download patched</button>
        </div>
    );
}

function SavePatch({ patch }) {
    function savePatch(patch) {
        fetch(`patches/${patch.file}`)
            .then((response) => response.blob())
            .then((patchData) => {
                patchData.arrayBuffer().then((buffer) => {
                    saveAs(new Blob([buffer]), patch.file);
                });
            });
    }
    return <button onClick={(p) => savePatch(patch)}>Download patch</button>;
}
function NewFileInput({ name, handleInput, hide }) {
    if (hide) return;
    return (
        <div className="input">
            <input name={name} type="file" onInput={handleInput} />
        </div>
    );
}

function YouTube({ vid }) {
    if (!vid) return;
    return (
        <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${vid}`}
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
        ></iframe>
    );
}

function Table({ patch, rom }) {
    if (!patch) return <table className="tableBox" />;
    return (
        <table className="tableBox">
            <tr>
                <td>
                    <h2>{patch.name}</h2>
                </td>
            </tr>
            <tr>
                <td>
                    <p>{patch.desc}</p>
                </td>
            </tr>
            <tr>
                <td>
                    <p>{`hacked by: ${patch.authors.join(', ')}`}</p>
                </td>
            </tr>
            <tr>
                <td>
                    <SavePatch patch={patch} />
                </td>
            </tr>
            <tr>
                <td>
                    <SaveFile text="download patched" rom={rom} patch={patch} />
                </td>
            </tr>
            <tr>
                <td>
                    <YouTube vid={patch.yt} />
                </td>
            </tr>
        </table>
    );
}
function SideNames({ filteredPatches, setPatch, patch }) {
    return (
        <>
            {filteredPatches.map((p) => {
                var className = 'patchChoice';
                if (JSON.stringify(p) === JSON.stringify(patch)) {
                    className = 'patchChoice patchSelected';
                }

                return (
                    <p className={className} onClick={() => setPatch(p)}>
                        {p.name}
                    </p>
                );
            })}
        </>
    );
}

function patchSomething(patch, rom) {
    const bpsTest = new RegExp(/\.bps$/);
    fetch(`patches/${patch.file}`)
        .then((response) => response.blob())
        .then((patchData) => {
            patchData.arrayBuffer().then((buffer) => {
                const marcPatch = new MarcFile(new Uint8Array(buffer));
                let patchParsed;
                if (bpsTest.test(patch.file)) {
                    console.log(patch.file);
                    patchParsed = parseBPSFile(marcPatch);
                } else {
                    console.log('IPS file');
                    patchParsed = parseIPSFile(marcPatch);
                }

                const patchedRom = patchParsed.apply(rom.contents, true);
                saveAs(
                    new Blob([patchedRom._u8array]),
                    patch.file.replace(/\.[bi]ps$/i, '.nes'),
                );
            });
        });
}

function filterPatches(filter, setFilteredPatches) {
    console.log(filter);
    if (!filter) {
        setFilteredPatches(sortedPatches);
        return;
    }
    setFilteredPatches(
        sortedPatches.filter((patch) => {
            const regexp = new RegExp(`${filter}`, 'i');
            if (regexp.test(patch.name)) return true;
            for (let author of patch.authors) {
                if (regexp.test(author)) return true;
            }
            return false;
        }),
    );
}

function App() {
    const [rom, setRom] = useState(null);
    const [romInfo, setRomInfo] = useState(
        <p className="romWaiting">Waiting...</p>,
    );
    const [filteredPatches, setFilteredPatches] = useState(sortedPatches);
    const [patch, setPatch] = useState(null);

    function handleRomInput(romFile) {
        var romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
        function onMarcRomLoad() {
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...romMarc._u8array.slice(16)]),
            );
            const hash = md5(romMarc._u8array).toString();
            if (hash === VANILLA_INES1_MD5) {
                setRomInfo(<p className="romValid">Valid ROM</p>);
                setRom({
                    filename: romFile.target.files[0].name,
                    contents: romMarc,
                });
            } else {
                setRomInfo(<p className="romInvalid">Invalid ROM</p>);
            }
        }
    }

    return (
        <div className="App">
            <header className="headerBox">
                <h2>Nestris Patches (with Patcher)</h2>
            </header>
            <div className="topBox">
                <div className="topInfoBox">
                    <Information
                        hide={false}
                        information="Download patch, or provide the backup of your nestris rom to download a patched version."
                    />
                </div>
                <div className="romInputBox">
                    <NewFileInput
                        name="RomInput"
                        handleInput={handleRomInput}
                    />
                    {romInfo}
                </div>
            </div>
            <div className="bottomBox">
                <div className="sideBox">
                    <input
                        placeholder="Search"
                        onChange={(e) =>
                            filterPatches(e.target.value, setFilteredPatches)
                        }
                    />
                    <SideNames
                        filteredPatches={filteredPatches}
                        setPatch={setPatch}
                        patch={patch}
                    />
                </div>
                <Table patch={patch} rom={rom} />
            </div>
            <div className="footerBox">
                <p> Thanks for visiting.  <a href="https://github.com/zohassadar/patches">Repo</a></p>
            </div>
        </div>
    );
}

export default App;
