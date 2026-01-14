"use client";

import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Site } from '@/lib/types';
import { MapPin, Navigation, ExternalLink, Building2, Loader2 } from 'lucide-react';

interface GoogleMapsViewProps {
    sites: Site[];
    selectedSiteId: string | null;
    onSiteSelect: (id: string) => void;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: 38.7223, // Lisbon
    lng: -9.1393,
};

const options = {
    disableDefaultUI: false,
    zoomControl: true,
    styles: [], // Could add custom dark mode styles here
};

export function GoogleMapsView({ sites, selectedSiteId, onSiteSelect }: GoogleMapsViewProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    const [map, setMap] = React.useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<Site | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);

        if (sites.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            sites.forEach(site => {
                if (site.latitude && site.longitude) {
                    bounds.extend({ lat: site.latitude, lng: site.longitude });
                }
            });
            map.fitBounds(bounds);
        }
    }, [sites]);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    // If a site is selected from the sidebar, center on it
    React.useEffect(() => {
        if (map && selectedSite && selectedSite.latitude && selectedSite.longitude) {
            map.panTo({ lat: selectedSite.latitude, lng: selectedSite.longitude });
            map.setZoom(15);
            setActiveMarker(selectedSite);
        }
    }, [selectedSite, map]);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900/50 p-8 text-center">
                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Erro ao carregar Mapas</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">
                    Verifique se a sua <strong>Google Maps API Key</strong> está corretamente configurada no ficheiro .env.local
                </p>
            </div>
        );
    }

    if (!apiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-indigo-50 dark:bg-indigo-900/20 p-12 text-center">
                <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200 dark:shadow-none rotate-3">
                    <MapPin className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Módulo de Mapas</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium leading-relaxed mb-8">
                    Para ativar a visualização em tempo real das unidades no Google Maps, é necessário configurar a chave de API da Google Cloud.
                </p>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-sm w-full text-left">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Configuração Necessária</div>
                    <code className="text-[10px] block bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-indigo-600 dark:text-indigo-400 font-bold mb-4">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
                    </code>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Adicione esta linha ao seu ficheiro .env.local</p>
                </div>
            </div>
        );
    }

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={options}
        >
            {sites.map((site) => (
                site.latitude && site.longitude && (
                    <Marker
                        key={site.id}
                        position={{ lat: site.latitude, lng: site.longitude }}
                        onClick={() => {
                            setActiveMarker(site);
                            onSiteSelect(site.id);
                        }}
                        animation={selectedSiteId === site.id ? window.google.maps.Animation.BOUNCE : undefined}
                    />
                )
            ))}

            {activeMarker && (
                <InfoWindow
                    position={{ lat: activeMarker.latitude!, lng: activeMarker.longitude! }}
                    onCloseClick={() => setActiveMarker(null)}
                >
                    <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 bg-slate-900 rounded flex items-center justify-center shrink-0">
                                <Building2 className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight text-slate-900">{(activeMarker as any).client?.name}</span>
                        </div>
                        <h4 className="font-black text-slate-900 mb-1">{activeMarker.name}</h4>
                        <p className="text-[10px] text-slate-500 mb-3">{activeMarker.address || 'Sem morada'}</p>
                        <div className="flex gap-2">
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.latitude},${activeMarker.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all"
                                title="Obter direções no Google Maps"
                            >
                                <Navigation className="h-3 w-3" /> Rota
                            </a>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${activeMarker.latitude},${activeMarker.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 flex items-center justify-center bg-slate-100 text-slate-900 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all"
                                title="Ver localização no Google Maps"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    ) : (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
    );
}
