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

const sortFilter = (p1, p2) =>
    p1.name.toLowerCase() > p2.name.toLowerCase() ? 1 : -1;

const sortedPatches = patches.sort(sortFilter);

const INES1HEADER = [78, 69, 83, 26, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const VANILLA_INES1_MD5 = 'ec58574d96bee8c8927884ae6e7a2508';

function savePatch(patch) {
    fetch(`patches/${patch.file}`)
        .then((response) => response.blob())
        .then((patchData) => {
            patchData.arrayBuffer().then((buffer) => {
                saveAs(new Blob([buffer]), patch.file);
            });
        });
}
function FileInput({
    name,
    handleInput,
    patch,
    rom,
    fileSelectedMsg,
    validRom,
}) {
    return (
        <>
            <div className="field is-grouped m-4">
                <button
                    className="button is-primary is-outlined"
                    onClick={() => savePatch(patch)}
                >
                    Get Patch
                </button>
                <button
                    className="button is-primary is-outlined"
                    onClick={() => patchRom(patch, rom)}
                    disabled={!rom}
                >
                    Get Patched ROM
                </button>
                <div
                    id="file-js-example"
                    className="file has-name is-primary is-outlined"
                >
                    <label className="file-label">
                        <input
                            className="file-input"
                            type="file"
                            name="resume"
                            onInput={handleInput}
                        />
                        <span className="file-cta">
                            <span className="file-label">
                                Select Original ROM
                            </span>
                        </span>
                        <span className="file-name">
                            {fileSelectedMsg}
                            {validRom ? '✅' : validRom === null ? '' : '❌'}
                        </span>
                    </label>
                </div>
            </div>
        </>
    );
}

function YouTube({ vid }) {
    if (!vid) return;
    const width = 400;
    return (
        <iframe
            className="content"
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

function Table({ patch }) {
    if (!patch) return <table className="box" />;
    return (
        <>
            <div className="card m-6 custom-mainpanel">
                <header className="media-content">
                    <p className="title is-3">{patch.name}</p>
                    <p className="subtitle is-6">{`by: ${patch.authors.join(
                        ', ',
                    )}`}</p>
                </header>
                <div className="columns">
                    {patch.desc ? (
                        <div className="column card-content m-6">
                            {patch.desc}
                        </div>
                    ) : (
                        ''
                    )}
                    {patch.yt ? (
                        <div className="column card-content m-6">
                            <YouTube vid={patch.yt} />
                        </div>
                    ) : (
                        ''
                    )}
                </div>
                {patch.link ? (
                    <div className="card-content">
                        <div className="content">
                            Link: <a href={patch.link}>{patch.link}</a>
                        </div>
                    </div>
                ) : (
                    ''
                )}
                {patch.source ? (
                    <div className="card-content">
                        <div className="content">
                            Source: <a href={patch.source}>{patch.source}</a>
                        </div>
                    </div>
                ) : (
                    ''
                )}
                <div className="card-footer"></div>
            </div>
        </>
    );
}
function SideNames({ filteredPatches, setPatch, patch }) {
    return (
        <div className="panel custom-sidepanel">
            <thead></thead>
            {filteredPatches.map((p) => {
                var className = 'has-text-primary';
                if (JSON.stringify(p) === JSON.stringify(patch)) {
                    className = 'has-text-info has-text-weight-bold';
                }
                return (
                    <a
                        href={`#${p.name.replace(/ /g, '+')}`}
                        className={`panel-block ${className}`}
                        onClick={() => setPatch(p)}
                    >
                        {p.name}
                    </a>
                );
            })}
        </div>
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
            if (patch.authors.some((author) => regexp.test(author)))
                return true;
            return false;
        }),
    );
}

function handleRomInput(romFile, setRom, setValidRom) {
    debugger;
    var romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
    function validateRom(marcfile) {
        const hash = md5(marcfile._u8array).toString();
        if (hash === VANILLA_INES1_MD5) {
            setValidRom(true);
            setRom({
                filename: romFile.target.files[0].name,
                contents: marcfile,
            });
            return true;
        }
        return false;
    }
    function onMarcRomLoad() {
        romMarc = new MarcFile(
            new Uint8Array([...INES1HEADER, ...romMarc._u8array.slice(16)]),
        );
        if (validateRom(romMarc)) return;

        // attempt to solve for the 256k rom
        const size = romMarc._u8array.length;
        if (size > 0x40000) {
            // assume no trainer
            const prg = [...romMarc._u8array.slice(0x10, 0x10 + 0x8000)];
            const chr = [
                ...romMarc._u8array.slice(0x10 + 0x20000, 0x10 + 0x24000),
            ];
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...prg, ...chr]),
            );
            if (validateRom(romMarc)) return;

            // assume trainer
            const prg2 = [...romMarc._u8array.slice(0x210, 0x210 + 0x8000)];
            const chr2 = [
                ...romMarc._u8array.slice(0x210 + 0x20000, 0x210 + 0x24000),
            ];
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...prg2, ...chr2]),
            );
            if (validateRom(romMarc)) return;
        }
        setValidRom(false);
        setRom(null);
    }
}
function App() {
    const [rom, setRom] = useState(null);
    const [validRom, setValidRom] = useState(null);
    const [fileSelectedMsg, setFileSelectedMsg] = useState('No file selected');
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

    return (
        <div className="container box content">
            <h2>Nestris Patches</h2>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
            <div className="box">
                <FileInput
                    patch={patch}
                    rom={rom}
                    validRom={validRom}
                    name="RomInput"
                    fileSelectedMsg={fileSelectedMsg}
                    handleInput={(romFile) => {
                        setFileSelectedMsg(romFile.target.files[0].name);
                        handleRomInput(romFile, setRom, setValidRom);
                    }}
                />
            </div>
            <div className="box columns">
                <div className="box column is-one-fifth">
                    <input
                        className="input"
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
                <div className="box column">
                    <Table patch={patch} rom={rom} />
                </div>
            </div>
            <div className="box content">
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
