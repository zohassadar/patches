import './App.scss';
import { useState } from 'react';
const patches = require('./patches.json');
const {
    saveAs,
    MarcFile,
    parseBPSFile,
    parseIPSFile,
    md5,
} = require('./bps.js');

const sortFilter = (p1, p2) => p1.name.toLowerCase() > p2.name.toLowerCase() ? 1 : -1;

const sortedPatches = patches.sort(sortFilter);

const INES1HEADER = [78, 69, 83, 26, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const VANILLA_INES1_MD5 = 'ec58574d96bee8c8927884ae6e7a2508';

function Information({ hide, information }) {
    if (hide) return;
    return <p className="info">{information}</p>;
}

function SavePatched({ rom, patch, clearFile }) {
    if (!rom) return;
    return (
        <>
            <div className="button_" onClick={() => patchRom(patch, rom)}>
                Apply Patch
            </div>
            <p className="clearFile" onClick={() => clearFile()}>
                unload rom
            </p>
        </>
    );
}
/*
function DisplayImage({ name, setImage }) {
    fetch(`patches/${name}`)
        .then((response) => response.blob())
        .then((blob) => {
            const img = URL.createObjectURL(blob);
            setImage(<img src={img} />);
        });
    let patch = { file: '' };
    return (
        <tr>
            <td>
                <img
                    src={`patches/screenshots/${patch.file.replace(
                        /\.[ib]ps/,
                        '_legal.png',
                    )}`}
                />
                <img
                    src={`patches/screenshots/${patch.file.replace(
                        /\.[ib]ps/,
                        '_title.png',
                    )}`}
                />
                <img
                    src={`patches/screenshots/${patch.file.replace(
                        /\.[ib]ps/,
                        '_gamemenu.png',
                    )}`}
                />
                <img
                    src={`patches/screenshots/${patch.file.replace(
                        /\.[ib]ps/,
                        '_levelmenu.png',
                    )}`}
                />
                <img
                    src={`patches/screenshots/${patch.file.replace(
                        /\.[ib]ps/,
                        '_game.png',
                    )}`}
                />
            </td>
        </tr>
    );
}
*/
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
    return (
        <div className="button_" onClick={() => savePatch(patch)}>
            Download Patch
        </div>
    );
}
function FileInput({ name, handleInput }) {
    return (
        <>
            <label className="button_">
                Select ROM to Apply Patch
                <input
                    className="buttonFile"
                    name={name}
                    type="file"
                    onInput={handleInput}
                />
            </label>
            <p className="noFile">no rom loaded</p>
        </>
    );
}

function YouTube({ vid }) {
    if (!vid) return;
    const width = 560;
    return (
        <iframe
            width={width}
            height={Math.floor(width * (315 / 560))}
            src={`https://www.youtube.com/embed/${vid}`}
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
        ></iframe>
    );
}

function Table({ patch, rom, romInputBox, clearFile }) {
    if (!patch) return <table className="romPanel" />;
    return (
        <div className="romPanel">
            <div className="romTitleBox">
                <h2>{patch.name}</h2>
                <p>{`by: ${patch.authors.join(', ')}`}</p>
                <SavePatch patch={patch} />
                {rom ? (
                    <div className="inputBox">
                        <SavePatched
                            text="download patched"
                            rom={rom}
                            patch={patch}
                            clearFile={clearFile}
                        />
                    </div>
                ) : (
                    <div className="inputBox">{romInputBox()}</div>
                )}
            </div>
            <table className="romDetailsBox">
                {patch.desc ? (
                    <tr>
                        <td>
                            <p>{patch.desc}</p>
                        </td>
                    </tr>
                ) : (
                    ''
                )}
                {patch.source ? (
                    <tr>
                        <td>
                            <a href={patch.source}>source</a>
                        </td>
                    </tr>
                ) : (
                    ''
                )}
                {patch.yt ? (
                    <tr>
                        <td>
                            <YouTube vid={patch.yt} />
                        </td>
                    </tr>
                ) : (
                    ''
                )}
            </table>
        </div>
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
                    <a
                        href={`#${p.name.replace(/ /g, '+')}`}
                        className={className}
                        onClick={() => setPatch(p)}
                    >
                        {p.name}
                    </a>
                );
            })}
        </>
    );
}

function patchRom(patch, rom) {
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

function handleRomInput(romFile, setRom, setRomInfo) {
    var romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
    function onMarcRomLoad() {
        romMarc = new MarcFile(
            new Uint8Array([...INES1HEADER, ...romMarc._u8array.slice(16)]),
        );
        const hash = md5(romMarc._u8array).toString();
        if (hash === VANILLA_INES1_MD5) {
            setRomInfo(<div className="romInfo romValid">Valid ROM</div>);
            setRom({
                filename: romFile.target.files[0].name,
                contents: romMarc,
            });
        } else {
            setRomInfo(<div className="romInfo romInvalid">Invalid ROM</div>);
            setRom(null);
        }
    }
}
function App() {
    const [rom, setRom] = useState(null);
    const [romInfo, setRomInfo] = useState(
        <div className="romInfo romWaiting">No ROM Loaded</div>,
    );
    const [filteredPatches, setFilteredPatches] = useState(sortedPatches);
    const [patch, setPatch] = useState(null);

    if (patch === null) {
        const parsedURL = new URL(window.location.href);
        const patchName = parsedURL.hash.slice(1).replace(/\+/g, ' ');
        if (patchName) {
            const patch = filteredPatches.find((p) => p.name === patchName);
            if (patch) setPatch(patch);
        }
    }

    function clearFile() {
        setRom(null);
        setRomInfo(<div className="romInfo romWaiting">ROM Unloaded</div>);
    }

    function romInputBox() {
        return (
            <div>
                <FileInput
                    name="RomInput"
                    handleInput={(romFile) =>
                        handleRomInput(romFile, setRom, setRomInfo)
                    }
                    clearFile={clearFile}
                />
            </div>
        );
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
                        information="Download patch, or provide backup of Nestris rom to apply patch in browser."
                    />
                </div>
                <div className="inputBox">{romInfo}</div>
            </div>
            <div className="bottomBox">
                <div className="filler" />
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
                <Table
                    patch={patch}
                    rom={rom}
                    romInputBox={romInputBox}
                    clearFile={clearFile}
                />
                <div className="filler" />
            </div>
            <div className="footerBox">
                <p>
                    Thanks for visiting. Leave feedback or contribute{' '}
                    <a href="https://github.com/zohassadar/patches">here</a>
                    {'. '}
                    Built using{' '}
                    <a href="https://github.com/marcrobledo/RomPatcher.js/">
                        RomPatcher.js
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}

export default App;
