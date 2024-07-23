import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LeafletMouseEvent } from "leaflet";
import axios from "axios";
import api from "../../services/api";

import './style.css';

import logo from "../../assets/logo.svg";

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECityResponse {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [uf, setUFs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    // const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormsData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });

    const [selectedUf, setSelectUf] = useState('0');
    const [selectedCity, setSelectCity] = useState('0');
    const [selectedItems, setSelectItems] = useState<number[]>([]);
    const [selectedPosition, setSelectPosition] = useState<[number, number]>([0, 0])

    const history = useHistory();

    useEffect(() =>  {
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>("https://servicodados.ibge.gov.br/api/v1/localidades/estados").then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);

            setUFs(ufInitials);
        });
    }, []);

    useEffect(() => {
        // carregar as cidades sempre que a uf mudar
        if(selectedUf === '0'){
            return
        }

        axios
            .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(response => {
                const cityNames = response.data.map(city => city.nome);

                setCities(cityNames);
            });

    }, [selectedUf]);

    // useEffect(() => {
    //     navigator.geolocation.getCurrentPosition(position => {
    //         const { latitude, longitude } = position.coords;

    //         setInitialPosition([latitude, longitude]);
    //     })
    // }, []);

    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;

        setSelectUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;

        setSelectCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setFormsData({ ... formData, [name]: value })
    }

    function handleSelectItem(id: number) {
        const alreadySelect = selectedItems.findIndex(item => item === id);

        if (alreadySelect >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectItems(filteredItems);
        } else {
            setSelectItems([ ...selectedItems, id ]);
        }

        
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf
        const city = selectedCity
        const items = selectedItems
        const [latitude, longitude] = selectedPosition;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        };

        await api.post('points', data);

        alert('Ponto de coleta criado!');

        history.push('/')
    }

    const MapEvents = () => {
        useMapEvents({
          click: handleMapClick,
        });
        return null;
      };

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />
            <Link to={"/"}>
                <FiArrowLeft />
                Voltar para home
            </Link>

            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="id"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input 
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <MapContainer  center={[ -28.6707202, -49.4764859 ]} zoom={15}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}/>
                        <MapEvents />
                    </MapContainer >    

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf" 
                                id="uf" 
                                value={selectedUf} 
                                onChange={handleSelectUF}
                            >
                                <option value="0">Selecione uma UF</option>
                                {uf.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
        
    );
}

export default CreatePoint