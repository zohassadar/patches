import './App.css';
import { useState } from 'react';

const { saveAs, MarcFile, md5, parseBPSFile } = require('./bps.js');

function Information({ hide, information }) {
    if (hide) return;
    return (
        <>
            <p>{information}</p>
        </>
    );
}

function SaveFile({ hide, file, text }) {
    if (hide) return;
    function downloadRom() {
        saveAs(new Blob([file.contents._u8array]), file.filename);
    }
    return (
        <>
            <button onClick={downloadRom}>{text}</button>
        </>
    );
}

function NewFileInput({ name, handleInput, hide }) {
    if (hide) return;
    return (
        <>
            <input name={name} type="file" onInput={handleInput} />
        </>
    );
}
/* eslint-disable */
function FileInput({ name, handleInput, hide }) {
    if (hide) return;
    function handleFileLoad(fileEvent, filename) {
        console.log(`Read ${fileEvent.target.result.length} bytes`);
        const contents = fileEvent.target.result;
        const bytes = new Uint8Array(contents.length);
        for (let i = 0; i < contents.length; i++) {
            bytes[i] = contents[i].charCodeAt(0);
        }
        handleInput({ filename: filename, contents: bytes });
    }

    function _handleInput(event) {
        const filename = event.target.files[0].name;
        const reader = new FileReader();
        reader.readAsBinaryString(event.target.files[0]);
        reader.onload = (fileEvent) => handleFileLoad(fileEvent, filename);
    }
    return (
        <>
            <input name={name} type="file" onInput={_handleInput} />
        </>
    );
}

/* eslint-enable */

function App() {
    const [rom, setRom] = useState(null);
    const [patch, setPatch] = useState(null);
    const [patched, setPatched] = useState(null);

    const [romInfo, setRomInfo] = useState('');
    const [patchInfo, setPatchInfo] = useState('');
    function handleRomInput(romFile) {
        const romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
        function onMarcRomLoad() {
            setRom({
                filename: romFile.target.files[0].name,
                contents: romMarc,
            });
            const hash = md5(romMarc._u8array).toString();
            setRomInfo(hash);
            let marcPatch;
            fetch('patches/tetris.bps')
                .then((response) => response.blob())
                .then((patchData) => {
                    patchData.arrayBuffer().then((buffer) => {
                        marcPatch = new MarcFile(new Uint8Array(buffer));

                        const patchParsed = parseBPSFile(marcPatch);
                        const patchedRom = patchParsed.apply(romMarc);
                        try {
                            setPatch(true);
                            setPatched({
                                filename: 'patched.nes',
                                contents: patchedRom,
                                valid: true,
                            });
                        } catch {
                            debugger;
                        }
                    });
                });
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <Information hide={false} information="give rom" />
                <NewFileInput name="RomInput" handleInput={handleRomInput} />
                <Information hide={!rom} information={romInfo} />
                <SaveFile
                    hide={!rom}
                    file={rom}
                    text="download unmodified rom"
                />
                <SaveFile
                    hide={!rom || !patch || (patched && !patched.valid)}
                    file={patched}
                    text="download patched"
                />
            </header>
        </div>
    );
}

export default App;
