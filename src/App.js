import './App.css';
import { useState } from 'react';
import { patches } from './patches.js';
const {
    saveAs,
    MarcFile,
    parseBPSFile,
    parseIPSFile,
    md5,
} = require('./bps.js');

const INES1HEADER = [78, 69, 83, 26, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const VANILLA_INES1_MD5 = 'ec58574d96bee8c8927884ae6e7a2508';

function Information({ hide, information }) {
    if (hide) return;
    return <p className="info">{information}</p>;
}

function SaveFile({ rom, patch }) {
    if (!rom) return;
    function downloadRom(data, name) {
        patchSomething(patch, rom);
    }
    return (
        <div className="download">
            <button onClick={downloadRom}>Download patched</button>
        </div>
    );
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
    if (!patch) return;
    return (
        <>
            <h3>{patch.name}</h3>
            <p>{patch.desc}</p>
            <p>{patch.authors.join(', ')}</p>
            <p>
                <a href={`/patches/${patch.file}`}>download patch</a>
            </p>
            <YouTube vid={patch.yt} />
            <SaveFile text="download patched" rom={rom} patch={patch} />
        </>
    );
}
function SideNames({ setPatch }) {
    return (
        <>
            {patches.map((patch) => {
                return <p onClick={() => setPatch(patch)}>{patch.name}</p>;
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
                saveAs(new Blob([patchedRom._u8array]), 'patched.nes');
            });
        });
}

function App() {
    const [rom, setRom] = useState(null);
    const [patched, setPatched] = useState(null);
    const [romInfo, setRomInfo] = useState('Waiting for Rom');

    const [patch, setPatch] = useState(null);

    function handleRomInput(romFile) {
        var romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
        function onMarcRomLoad() {
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...romMarc._u8array.slice(16)]),
            );
            const hash = md5(romMarc._u8array).toString();
            if (hash == VANILLA_INES1_MD5) {
                setRomInfo('This rom will work!');
                setRom({
                    filename: romFile.target.files[0].name,
                    contents: romMarc,
                });
            } else {
                setRomInfo('Unknown rom');
            }
        }
    }

    return (
        <div className="App">
            <header className="headerBox">
                <Information information="Patch tetris.nes" />
            </header>
            <div className="topBox">
                <Information hide={false} information="give rom" />
                <NewFileInput name="RomInput" handleInput={handleRomInput} />
                <Information information={romInfo} />
            </div>
            <div className="bottomBox">
                <div className="sideBox">
                    <SideNames setPatch={setPatch} />
                </div>
                <div className="tableBox">
                    <Table patch={patch} rom={rom} />
                </div>
            </div>
        </div>
    );
}

export default App;
