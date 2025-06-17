import './App.scss';
import { useState, useEffect } from 'react';
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

// not using this for now, but this version being different from what's saved
// is what would make the modal show up if it weren't disabled
const VERSION = '104';
const VERSION_TAG = 'patchesVersion';
const ROM_TAG = 'savedRomBytes';
const ROM_NAME_TAG = 'savedRomName';
const ROM_DATE_TAG = 'savedRomDate';
const ROM_HASH_TAG = 'savedRomHash';
const INES1HEADER = [78, 69, 83, 26, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const VANILLA_INES1_MD5 = 'ec58574d96bee8c8927884ae6e7a2508';

const TITLE = 'Nestris Patches';
const BRIEF =
    'Collection of Rom Hacks for the 1989 NES game Tetris.  Includes browser based patching tool.';

const DEFAULT_FILE = 'No file selected';
const DEFAULT_MD5 = 'Waiting...';

function savePatch(patch) {
    fetch(`patches/${patch.file}`)
        .then((response) => response.blob())
        .then((patchData) => {
            patchData.arrayBuffer().then((buffer) => {
                saveAs(new Blob([buffer]), patch.file);
            });
        });
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
                    patchParsed = parseBPSFile(marcPatch);
                } else {
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

function YouTube({ vid }) {
    if (!vid) return;
    const width = 480;
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

// marcFile, str, bool
const validateRom = (
    marcfile,
    romName,
    saveLocal,
    setValidRom,
    setRom,
    setRomDate,
    remember,
) => {
    const hash = md5(marcfile._u8array).toString();
    if (hash === VANILLA_INES1_MD5) {
        const timestamp = new Date().toLocaleString();
        setValidRom(true);
        setRom({
            filename: romName,
            contents: marcfile,
        });
        setRomDate(timestamp);
        if (saveLocal && remember) {
            localStorage.setItem(ROM_TAG, JSON.stringify(marcfile._u8array));
            localStorage.setItem(ROM_NAME_TAG, romName);
            localStorage.setItem(ROM_DATE_TAG, timestamp);
        }
        // console.log('Valid rom found!');
        return true;
    }
    // console.error('invalid rom');
    return false;
};

function App() {
    const [showModal, setShowModal] = useState(null);
    const [remember, setRemember] = useState(null);
    const [rom, setRom] = useState(null);
    const [romDate, setRomDate] = useState(null);
    const [validRom, setValidRom] = useState(null);
    const [fileSelectedMsg, setFileSelectedMsg] = useState(DEFAULT_FILE);
    const [filteredPatches, setFilteredPatches] = useState(sortedPatches);
    const [patch, setPatch] = useState(null);
    const [md5sum, setMd5sum] = useState(DEFAULT_MD5);
    const [confirming, setConfirming] = useState(null);
    const active = 'patches';

    function cleanUpRom() {
        setMd5sum(DEFAULT_MD5);
        setRomDate(null);
        setRom(null);
        setValidRom(null);
        setRemember(false);
        setFileSelectedMsg(DEFAULT_FILE);
        localStorage.removeItem(ROM_TAG);
        localStorage.removeItem(ROM_NAME_TAG);
        localStorage.removeItem(ROM_DATE_TAG);
        localStorage.removeItem(ROM_HASH_TAG);
    }

    useEffect(() => {
        // show modal or no
        setShowModal(localStorage.getItem(VERSION_TAG) !== VERSION);
        localStorage.setItem(VERSION_TAG, VERSION);

        // has a rom been saved?
        const savedRom = localStorage.getItem(ROM_TAG);
        const savedRomName = localStorage.getItem(ROM_NAME_TAG);
        const savedRomDate = localStorage.getItem(ROM_DATE_TAG);
        const savedRomHash = localStorage.getItem(ROM_HASH_TAG);
        if (!(savedRom && savedRomName && savedRomDate && savedRomHash)) {
            // cleanup if we don't have everything
            cleanUpRom();
        } else {
            const romBytes = new Uint8Array(
                Object.values(JSON.parse(savedRom)),
            );
            const marcFile = new MarcFile(romBytes);
            if (
                validateRom(
                    marcFile,
                    savedRomName,
                    false,
                    setValidRom,
                    setRom,
                    setRomDate,
                    remember,
                )
            ) {
                setFileSelectedMsg(savedRomName);
                setMd5sum(savedRomHash);
                setRomDate(savedRomDate);
                setRemember(true);
            } else {
                // clean if rom is invalid
                cleanUpRom();
            }
        }
    }, [remember]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setShowModal(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    // Uint8Array, str, bool
    function handleRomInput(romArray, romName, fromFile) {
        var romOrig = new MarcFile(romArray);
        const origHash = md5(romOrig._u8array).toString();
        setMd5sum(origHash);
        localStorage.setItem(ROM_HASH_TAG, origHash);

        // console.log('Attempting unmodified header');
        if (
            validateRom(
                romOrig,
                romName,
                fromFile,
                setValidRom,
                setRom,
                setRomDate,
                remember,
            )
        )
            return;

        // replace the presumably ines2.0 header with v1 and try again
        // console.log('Attempting with ines v1 header');
        var romMarc = new MarcFile(
            new Uint8Array([...INES1HEADER, ...romOrig._u8array.slice(16)]),
        );
        if (
            validateRom(
                romMarc,
                romName,
                fromFile,
                setValidRom,
                setRom,
                setRomDate,
                remember,
            )
        )
            return;
        // console.log('checking for large rom');

        // attempt to solve for the 256k rom
        // i've never seen it, so i'm making assumptions
        const size = romMarc._u8array.length;
        if (size > 0x40000) {
            // assume normal header
            const prg = [...romOrig._u8array.slice(0x10, 0x10 + 0x8000)];
            const chr = [
                ...romOrig._u8array.slice(0x10 + 0x20000, 0x10 + 0x24000),
            ];
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...prg, ...chr]),
            );
            // console.log('attempting to handle large rom with normal header');
            if (
                validateRom(
                    romMarc,
                    romName,
                    fromFile,
                    setValidRom,
                    setRom,
                    setRomDate,
                    remember,
                )
            )
                return;

            // assume trainer present (how likely is this even)
            const prg2 = [...romMarc._u8array.slice(0x210, 0x210 + 0x8000)];
            const chr2 = [
                ...romMarc._u8array.slice(0x210 + 0x20000, 0x210 + 0x24000),
            ];
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...prg2, ...chr2]),
            );
            // console.log('attempting to handle large rom with trainer header');
            if (
                validateRom(
                    romMarc,
                    romName,
                    fromFile,
                    setValidRom,
                    setRom,
                    setRomDate,
                    remember,
                )
            )
                return;
        }
        setValidRom(false);
        setRom(null);
    }

    function handleFileInput(event) {
        const fileName = event.target.files[0].name;
        const reader = new FileReader();
        reader.onload = () => handleRomInput(reader.result, fileName, true);
        reader.onerror = (error) =>
            console.error(`error reading file ${error}`);
        reader.readAsArrayBuffer(event.target.files[0]);
    }

    function FileButton() {
        return (
            <div className="file has-name is-info">
                <label className="file-label">
                    <input
                        className="file-input"
                        type="file"
                        name="resume"
                        onInput={(event) => {
                            setFileSelectedMsg(event.target.files[0].name);
                            handleFileInput(event);
                            setShowModal(false);
                        }}
                    />
                    <span className="file-cta">
                        <span className="file-label">
                            {rom ? 'Original Rom' : 'Select Original Rom'}
                        </span>
                    </span>
                    <span className="file-name">
                        {fileSelectedMsg}
                        {validRom ? '✅' : validRom === null ? '' : '❌'}
                    </span>
                </label>
            </div>
        );
    }
    if (patch === null) {
        const parsedURL = new URL(window.location.href);
        const patchName = parsedURL.hash.slice(1).replace(/\+/g, ' ');
        if (patchName) {
            const patch = filteredPatches.find((p) => p.name === patchName);
            if (patch) setPatch(patch);
        }
    }
    const favorite = patches[Math.floor(Math.random() * patches.length)];
    return (
        <>
            {/* make modal go away for now */}
            <div className={showModal && false ? 'modal is-active' : 'modal'}>
                <div
                    className="modal-background"
                    onClick={() => setShowModal(false)}
                ></div>
                <div className="modal-card is-fullwidth">
                    {!patch ? (
                        <header className="modal-card-head">
                            <div>
                                <p className="modal-card-title is-size-2">
                                    {TITLE}
                                </p>
                                <p className="subtitle is-6">{BRIEF}</p>
                            </div>
                        </header>
                    ) : (
                        ''
                    )}
                    <section className="modal-card-body">
                        <div className="content">
                            <h3>Select a Rom</h3>
                            <p>
                                {patch
                                    ? `To get a patched version of ${patch.name}, select a valid nestris rom.`
                                    : 'To get started, select a valid nestris rom to patch.'}
                            </p>
                            <div className="grid">
                                <cell>
                                    <FileButton />
                                </cell>
                                <cell>
                                    <button
                                        className="button is-success is-outlined is-fullwidth"
                                        onClick={() => setShowModal(false)}
                                        disabled={!rom}
                                    >
                                        {patch
                                            ? `Continue to ${patch.name}`
                                            : 'Continue to browse patches'}
                                    </button>
                                </cell>
                            </div>
                            <pre>md5sum: {md5sum} </pre>
                        </div>
                        {!patch && (
                            <div className="content m-3">
                                <h3>What is this?</h3>
                                <p>
                                    This is a collection of Rom Hacks for the
                                    1989 NES Game Tetris that includes over 100
                                    hacks from dozens of creators. It also
                                    provides a way to patch your Rom in the
                                    browser, based off of{' '}
                                    <a href="https://www.marcrobledo.com/RomPatcher.js/">
                                        Rom Patcher JS
                                    </a>
                                    . As time permits more hacks and information
                                    will be added. Until then, please check out
                                    my favorite hack{' '}
                                    <a
                                        href={`#${favorite.name.replace(
                                            / /g,
                                            '+',
                                        )}`}
                                        onClick={() => {
                                            setShowModal(false);
                                            setPatch(favorite);
                                        }}
                                    >
                                        {`${favorite.name}`}
                                    </a>
                                </p>
                                <h3>Where did you get these patches?</h3>
                                <ul>
                                    <li>
                                        <a href="https://www.romhacking.net/">
                                            ROMhacking.net
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://ctm.gg/codes-tools-and-patches/">
                                            Classic Tetris Monthly's Codes,
                                            Tools, and Patches
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://go.ctm.gg/discord">
                                            Classic Tetris Monthly's Discord
                                        </a>
                                    </li>
                                    <li>
                                        Directly from the creator or creator's
                                        website
                                    </li>
                                    <li>I made them</li>
                                </ul>
                            </div>
                        )}
                    </section>
                    <footer className="modal-card-foot">
                        <button
                            className="button is-info is-outlined is-fullwidth"
                            onClick={() => setShowModal(false)}
                        >
                            {patch
                                ? `Skip loading Rom, I'm only here to see ${patch.name}`
                                : "Skip loading Rom, I'm only here to browse patches"}
                        </button>
                    </footer>
                    <button
                        className="modal-close is-large"
                        aria-label="close"
                        onClick={() => setShowModal(false)}
                    ></button>
                </div>
            </div>

            <div className="container box">
                <div className="columns">
                    <div className="column is-three-fifths content">
                        <h1 className="m-0">{TITLE}</h1>
                        <p>{BRIEF}</p>
                    </div>
                    <div className="column is-two-fifths">
                        <FileButton />
                        <div className="columns">
                            <pre className="column p-1">
                                {md5sum}
                                {'\n'}
                                {romDate ? romDate : ' '}
                            </pre>
                            <div className="column p-1 is-two-fifths">
                                {rom && remember ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (confirming) {
                                                    cleanUpRom();
                                                }
                                                setConfirming(!confirming);
                                            }}
                                            className={`button is-outlined ${
                                                confirming
                                                    ? 'is-warning'
                                                    : 'is-info'
                                            }`}
                                        >
                                            {confirming ? 'confirm' : 'forget'}
                                        </button>

                                        {confirming && (
                                            <button
                                                onClick={() =>
                                                    setConfirming(false)
                                                }
                                                className="button is-outlined is-success"
                                            >
                                                cancel
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <label class="checkbox">
                                            <input
                                                type="checkbox"
                                                checked={remember}
                                                onChange={(event) => {
                                                    const newRemember =
                                                        !remember;
                                                    setRemember(newRemember);
                                                    if (rom && newRemember) {
                                                        localStorage.setItem(
                                                            ROM_TAG,
                                                            JSON.stringify(
                                                                rom.contents
                                                                    ._u8array,
                                                            ),
                                                        );
                                                        localStorage.setItem(
                                                            ROM_NAME_TAG,
                                                            fileSelectedMsg,
                                                        );
                                                        localStorage.setItem(
                                                            ROM_DATE_TAG,
                                                            romDate,
                                                        );
                                                    }
                                                }}
                                            />
                                            Remember rom
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="columns">
                    <div className="column">
                        <button
                            className="button is-info is-outlined is-fullwidth"
                            disabled={!patch}
                            onClick={() => savePatch(patch)}
                        >
                            {patch ? `Save ${patch.file}` : 'No Patch Selected'}
                        </button>
                    </div>
                    <div className="column">
                        <button
                            className="button is-success is-outlined is-fullwidth"
                            onClick={() => patchRom(patch, rom)}
                            disabled={!rom || !patch}
                        >
                            {rom
                                ? patch
                                    ? `Save As ${patch.file.replace(
                                          /\.[bi]ps/,
                                          '',
                                      )}.nes`
                                    : 'Select Patch To Apply To Original Rom'
                                : 'Select Original Rom To Get Patched Version'}
                        </button>
                    </div>
                </div>
                {false && ( // come back to this!
                    <div className="tabs is-fullwidth">
                        <ul>
                            <li className="m-3">
                                <span onClick={() => setShowModal(true)}>
                                    <button
                                        className="button is-info is-fullwidth"
                                        disabled={0}
                                    >
                                        Choose Patch
                                    </button>
                                </span>
                            </li>
                            <li className="m-3">
                                <span onClick={() => setShowModal(true)}>
                                    <button
                                        className="button is-info is-fullwidth is-outlined"
                                        disabled={0}
                                    >
                                        Choose Palette
                                    </button>
                                </span>
                            </li>
                            <li className="m-3">
                                <span onClick={() => setShowModal(true)}>
                                    <button
                                        className="button is-info is-fullwidth is-outlined"
                                        disabled={1}
                                    >
                                        Choose GG Code
                                    </button>
                                </span>
                            </li>
                            <li className="m-3">
                                <span onClick={() => setShowModal(true)}>
                                    <button
                                        className="button is-info is-fullwidth is-outlined"
                                        disabled={1}
                                    >
                                        Choose Filename
                                    </button>
                                </span>
                            </li>
                        </ul>
                    </div>
                )}
                {active === 'patches' && (
                    <div className="columns">
                        <div className="column is-one-quarter m-3">
                            <input
                                className="input"
                                placeholder="Search"
                                onChange={(e) =>
                                    filterPatches(
                                        e.target.value,
                                        setFilteredPatches,
                                    )
                                }
                            />
                            <div className="panel custom-sidepanel">
                                {filteredPatches.map((p, i) => (
                                    <a
                                        key={i}
                                        href={`#${p.name.replace(/ /g, '+')}`}
                                        className={`panel-block has-text-${
                                            JSON.stringify(p) ===
                                            JSON.stringify(patch)
                                                ? 'primary has-text-weight-bold'
                                                : 'info'
                                        }`}
                                        onClick={() => setPatch(p)}
                                    >
                                        {p.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                        {!patch ? (
                            <table className="box column card m-3 custom-mainpanel" />
                        ) : (
                            <div className="box column custom-mainpanel is-fullwidth">
                                <div className="content is-fullwidth">
                                    <header className="content">
                                        <p className="title is-3">
                                            {patch.name}
                                        </p>
                                        <p className="subtitle is-6">{`by: ${patch.authors.join(
                                            ', ',
                                        )}`}</p>
                                    </header>
                                    <div className="content m-3">
                                        {patch.desc ? (
                                            <>
                                                {patch.desc
                                                    .split(/\n/)
                                                    .map((c, i) => (
                                                        <p key={i}>{c}</p>
                                                    ))}
                                            </>
                                        ) : (
                                            ''
                                        )}
                                        {patch.link ? (
                                            <>
                                                <p className="m-0">
                                                    {' '}
                                                    <a href={patch.link}>
                                                        {patch.link}
                                                    </a>
                                                </p>
                                            </>
                                        ) : (
                                            ''
                                        )}
                                        {patch.source ? (
                                            <>
                                                <p className="m-0">
                                                    <a href={patch.source}>
                                                        {patch.source}
                                                    </a>
                                                </p>
                                            </>
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                    {patch.yt ? (
                                        <div className="card-content m-3">
                                            <YouTube vid={patch.yt} />
                                        </div>
                                    ) : (
                                        ''
                                    )}
                                </div>
                                <div className="m-3 fixed-grid has-auto-count">
                                    <div className="grid">
                                        {!patch.screenshots
                                            ? ''
                                            : patch.screenshots.map((w) => {
                                                  return (
                                                      <div className="cell content m-1">
                                                          <img
                                                              alt="screenshot"
                                                              src={`screenshots/${w}`}
                                                          ></img>
                                                      </div>
                                                  );
                                              })}
                                    </div>
                                </div>
                                <div className="m-3 fixed-grid has-auto-count">
                                    <div className="grid">
                                        {'legal,title,gamemenu,levelmenu,game'
                                            .split(',')
                                            .filter(
                                                () =>
                                                    false && !patch.screenshots,
                                            )
                                            .map((w) => {
                                                return (
                                                    <div className="cell content m-1">
                                                        <img
                                                            alt="screenshot"
                                                            src={`screenshots/${patch.file.replace(
                                                                /\.[bi]ps/,
                                                                '',
                                                            )}_${w}.png`}
                                                        ></img>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {active === 'colors' && (
                    <div className="box custom-mainpanel">Do Colors here</div>
                )}

                <footer className="box">
                    <div className="content">
                        <p>
                            Thanks for visiting. Leave feedback or contribute{' '}
                            <a href="https://github.com/zohassadar/patches">
                                here
                            </a>
                            {'. '}
                            Built using{' '}
                            <a href="https://github.com/marcrobledo/RomPatcher.js/">
                                RomPatcher.js
                            </a>
                            .
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default App;
